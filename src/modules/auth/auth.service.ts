import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Authenticator } from '@otplib/core';
import type { Prisma } from '@prisma/client';
import { Email, MfaMethod, User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { createHash } from 'crypto';
import got from 'got/dist/source';
import anonymize from 'ip-anonymize';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import randomColor from 'randomcolor';
import { UAParser } from 'ua-parser-js';
import {
  COMPROMISED_PASSWORD,
  EMAIL_USER_CONFLICT,
  EMAIL_VERIFIED_CONFLICT,
  INVALID_CREDENTIALS,
  INVALID_MFA_CODE,
  MFA_BACKUP_CODE_USED,
  MFA_ENABLED_CONFLICT,
  MFA_NOT_ENABLED,
  MFA_PHONE_NOT_FOUND,
  NO_EMAILS,
  NO_TOKEN_PROVIDED,
  SESSION_NOT_FOUND,
  UNVERIFIED_EMAIL,
  UNVERIFIED_LOCATION,
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { safeEmail } from '../../helpers/safe-email';
import { GeolocationService } from '../../providers/geolocation/geolocation.service';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { PwnedService } from '../../providers/pwned/pwned.service';
import {
  APPROVE_SUBNET_TOKEN,
  EMAIL_MFA_TOKEN,
  EMAIL_VERIFY_TOKEN,
  LOGIN_ACCESS_TOKEN,
  MERGE_ACCOUNTS_TOKEN,
  MULTI_FACTOR_TOKEN,
  PASSWORD_RESET_TOKEN,
} from '../../providers/tokens/tokens.constants';
import { TokensService } from '../../providers/tokens/tokens.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { RegisterDto } from './auth.dto';
import {
  AccessTokenClaims,
  MfaTokenPayload,
  TokenResponse,
  TotpTokenResponse,
} from './auth.interface';

@Injectable()
export class AuthService {
  authenticator: Authenticator;

  constructor(
    private prisma: PrismaService,
    private email: MailService,
    private configService: ConfigService,
    private pwnedService: PwnedService,
    private tokensService: TokensService,
    private geolocationService: GeolocationService,
    private approvedSubnetsService: ApprovedSubnetsService,
    private twilioService: TwilioService,
  ) {
    this.authenticator = authenticator.create({
      window: [
        this.configService.get<number>('security.totpWindowPast') ?? 0,
        this.configService.get<number>('security.totpWindowFuture') ?? 0,
      ],
    });
  }

  async login(
    ipAddress: string,
    userAgent: string,
    email: string,
    password?: string,
    code?: string,
  ): Promise<TokenResponse | TotpTokenResponse> {
    const emailSafe = safeEmail(email);
    const user = await this.prisma.user.findFirst({
      where: { emails: { some: { emailSafe } } },
      include: {
        emails: true,
        prefersEmail: true,
      },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (!user.active)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { active: true },
      });
    if (!user.emails.find((i) => i.emailSafe === emailSafe)?.isVerified)
      throw new UnauthorizedException(UNVERIFIED_EMAIL);
    if (!password || !user.password) return this.mfaResponse(user, 'EMAIL');
    if (!user.prefersEmail) throw new BadRequestException(NO_EMAILS);
    if (!(await compare(password, user.password)))
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (code)
      return this.loginUserWithTotpCode(ipAddress, userAgent, user.id, code);
    if (user.twoFactorMethod !== 'NONE') return this.mfaResponse(user);
    await this.checkLoginSubnet(
      ipAddress,
      userAgent,
      user.checkLocationOnLogin,
      user.id,
    );
    return this.loginResponse(ipAddress, userAgent, user);
  }

  async register(ipAddress: string, _data: RegisterDto): Promise<Expose<User>> {
    const { email, ...data } = _data;
    const emailSafe = safeEmail(email);
    const testUser = await this.prisma.user.findFirst({
      where: { emails: { some: { emailSafe } } },
    });
    if (testUser) throw new ConflictException(EMAIL_USER_CONFLICT);
    const ignorePwnedPassword = !!data.ignorePwnedPassword;
    delete data.ignorePwnedPassword;

    if (data.name)
      data.name = data.name
        .split(' ')
        .map((word, index) =>
          index === 0 || index === data.name.split(' ').length
            ? (word.charAt(0) ?? '').toUpperCase() +
              (word.slice(1) ?? '').toLowerCase()
            : word,
        )
        .join(' ');
    if (data.password)
      data.password = await this.hashAndValidatePassword(
        data.password,
        ignorePwnedPassword,
      );
    let initials = data.name.trim().substr(0, 2).toUpperCase();
    if (data.name.includes(' '))
      initials = data.name
        .split(' ')
        .map((i) => i.trim().substr(0, 1))
        .join('')
        .toUpperCase();
    data.profilePictureUrl =
      data.profilePictureUrl ??
      `https://ui-avatars.com/api/?name=${initials}&background=${randomColor({
        luminosity: 'light',
      })}&color=000000`;

    for await (const emailString of [email, emailSafe]) {
      const md5Email = createHash('md5').update(emailString).digest('hex');
      try {
        const img = await got(
          `https://www.gravatar.com/avatar/${md5Email}?d=404`,
          { responseType: 'buffer' },
        );
        if (img.body.byteLength > 1)
          data.profilePictureUrl = `https://www.gravatar.com/avatar/${md5Email}?d=mp`;
      } catch (error) {}
    }

    const user = await this.prisma.user.create({
      data: {
        ...data,
        emails: {
          create: { email: email, emailSafe },
        },
      },
      include: { emails: { select: { id: true } } },
    });
    if (user.emails[0]?.id)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { prefersEmail: { connect: { id: user.emails[0].id } } },
      });
    await this.sendEmailVerification(email);
    await this.approvedSubnetsService.approveNewSubnet(user.id, ipAddress);
    return this.prisma.expose(user);
  }

  async sendEmailVerification(email: string, resend = false) {
    const emailSafe = safeEmail(email);
    const emailDetails = await this.prisma.email.findFirst({
      where: { emailSafe },
      include: { user: true },
    });
    if (!emailDetails) throw new NotFoundException(USER_NOT_FOUND);
    if (emailDetails.isVerified)
      throw new ConflictException(EMAIL_VERIFIED_CONFLICT);
    this.email.send({
      to: `"${emailDetails.user.name}" <${email}>`,
      template: resend
        ? 'auth/resend-email-verification'
        : 'auth/email-verification',
      data: {
        name: emailDetails.user.name,
        days: 7,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/auth/link/verify-email?token=${this.tokensService.signJwt(
          EMAIL_VERIFY_TOKEN,
          { id: emailDetails.id },
          '7d',
        )}`,
      },
    });
    return { queued: true };
  }

  async refresh(
    ipAddress: string,
    userAgent: string,
    token: string,
  ): Promise<TokenResponse> {
    if (!token) throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    const session = await this.prisma.session.findFirst({
      where: { token },
      include: { user: true },
    });
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    await this.prisma.session.updateMany({
      where: { token },
      data: { ipAddress, userAgent },
    });
    return {
      accessToken: await this.getAccessToken(session.user),
      refreshToken: token,
    };
  }

  async logout(token: string): Promise<void> {
    if (!token) throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    const session = await this.prisma.session.findFirst({
      where: { token },
      select: { id: true, user: { select: { id: true } } },
    });
    if (!session) throw new NotFoundException(SESSION_NOT_FOUND);
    await this.prisma.session.delete({
      where: { id: session.id },
    });
  }

  async approveSubnet(
    ipAddress: string,
    userAgent: string,
    token: string,
  ): Promise<TokenResponse> {
    if (!token) throw new UnprocessableEntityException(NO_TOKEN_PROVIDED);
    const { id } = this.tokensService.verify<{ id: number }>(
      APPROVE_SUBNET_TOKEN,
      token,
    );
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    await this.approvedSubnetsService.approveNewSubnet(id, ipAddress);
    return this.loginResponse(ipAddress, userAgent, user);
  }

  /**
   * Get the two-factor authentication QR code
   * @returns Data URI string with QR code image
   */
  async getTotpQrCode(userId: number): Promise<string> {
    const secret = this.tokensService.generateUuid();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    const otpauth = this.authenticator.keyuri(
      userId.toString(),
      this.configService.get<string>('meta.appName') ?? '',
      secret,
    );
    return qrcode.toDataURL(otpauth);
  }

  /** Enable two-factor authentication */
  async enableMfaMethod(
    method: MfaMethod,
    userId: number,
    code: string,
  ): Promise<Expose<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorMethod: true },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.twoFactorMethod !== 'NONE')
      throw new ConflictException(MFA_ENABLED_CONFLICT);
    if (!user.twoFactorSecret)
      user.twoFactorSecret = this.tokensService.generateUuid();
    if (!this.authenticator.check(code, user.twoFactorSecret))
      throw new UnauthorizedException(INVALID_MFA_CODE);
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorMethod: method, twoFactorSecret: user.twoFactorSecret },
    });
    return this.prisma.expose<User>(result);
  }

  async loginWithTotp(
    ipAddress: string,
    userAgent: string,
    token: string,
    code: string,
  ): Promise<TokenResponse> {
    const { id } = this.tokensService.verify<MfaTokenPayload>(
      MULTI_FACTOR_TOKEN,
      token,
    );
    return this.loginUserWithTotpCode(ipAddress, userAgent, id, code);
  }

  async loginWithEmailToken(
    ipAddress: string,
    userAgent: string,
    token: string,
  ): Promise<TokenResponse> {
    const { id } = this.tokensService.verify<MfaTokenPayload>(
      EMAIL_MFA_TOKEN,
      token,
    );
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    await this.approvedSubnetsService.upsertNewSubnet(id, ipAddress);
    return this.loginResponse(ipAddress, userAgent, user);
  }

  async requestPasswordReset(email: string) {
    const emailSafe = safeEmail(email);
    const emailDetails = await this.prisma.email.findFirst({
      where: { emailSafe },
      include: { user: true },
    });
    if (!emailDetails) throw new NotFoundException(USER_NOT_FOUND);
    this.email.send({
      to: `"${emailDetails.user.name}" <${email}>`,
      template: 'auth/password-reset',
      data: {
        name: emailDetails.user.name,
        minutes: 30,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/auth/link/reset-password?token=${this.tokensService.signJwt(
          PASSWORD_RESET_TOKEN,
          { id: emailDetails.user.id },
          '30m',
        )}`,
      },
    });
    return { queued: true };
  }

  async resetPassword(
    ipAddress: string,
    userAgent: string,
    token: string,
    password: string,
    ignorePwnedPassword?: boolean,
  ): Promise<TokenResponse> {
    const { id } = this.tokensService.verify<{ id: number }>(
      PASSWORD_RESET_TOKEN,
      token,
    );
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    password = await this.hashAndValidatePassword(
      password,
      !!ignorePwnedPassword,
    );
    await this.prisma.user.update({ where: { id }, data: { password } });
    await this.approvedSubnetsService.upsertNewSubnet(id, ipAddress);
    return this.loginResponse(ipAddress, userAgent, user);
  }

  async verifyEmail(
    ipAddress: string,
    userAgent: string,
    token: string,
  ): Promise<TokenResponse> {
    const { id } = this.tokensService.verify<{ id: number }>(
      EMAIL_VERIFY_TOKEN,
      token,
    );
    const result = await this.prisma.email.update({
      where: { id },
      data: { isVerified: true },
      include: { user: true },
    });
    const groupsToJoin = await this.prisma.group.findMany({
      where: {
        autoJoinDomain: true,
        domains: {
          some: { isVerified: true, domain: result.emailSafe.split('@')[1] },
        },
      },
      select: { id: true, name: true },
    });
    for await (const group of groupsToJoin) {
      await this.prisma.membership.create({
        data: {
          user: { connect: { id: result.user.id } },
          group: { connect: { id: group.id } },
          role: 'MEMBER',
        },
      });
      this.email.send({
        to: `"${result.user.name}" <${result.email}>`,
        template: 'groups/invitation',
        data: {
          name: result.user.name,
          group: group.name,
          link: `${this.configService.get<string>('frontendUrl')}/groups/${
            group.id
          }`,
        },
      });
    }
    return this.loginResponse(ipAddress, userAgent, result.user);
  }

  getOneTimePassword(secret: string): string {
    return this.authenticator.generate(secret);
  }

  private async loginUserWithTotpCode(
    ipAddress: string,
    userAgent: string,
    id: number,
    code: string,
  ): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { prefersEmail: true },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.twoFactorMethod === 'NONE' || !user.twoFactorSecret)
      throw new BadRequestException(MFA_NOT_ENABLED);
    if (this.authenticator.check(code, user.twoFactorSecret))
      return this.loginResponse(ipAddress, userAgent, user);
    const backupCodes = await this.prisma.backupCode.findMany({
      where: { user: { id } },
    });
    let usedBackupCode = false;
    for await (const backupCode of backupCodes) {
      if (await compare(code, backupCode.code)) {
        if (!usedBackupCode) {
          if (backupCode.isUsed)
            throw new UnauthorizedException(MFA_BACKUP_CODE_USED);
          usedBackupCode = true;
          await this.prisma.backupCode.update({
            where: { id: backupCode.id },
            data: { isUsed: true },
          });
          const location = await this.geolocationService.getLocation(ipAddress);
          const locationName =
            [
              location?.city?.names?.en,
              (location?.subdivisions ?? [])[0]?.names?.en,
              location?.country?.names?.en,
            ]
              .filter((i) => i)
              .join(', ') || 'Unknown location';
          if (user.prefersEmail)
            this.email.send({
              to: `"${user.name}" <${user.prefersEmail.email}>`,
              template: 'auth/used-backup-code',
              data: {
                name: user.name,
                locationName,
                link: `${this.configService.get<string>(
                  'frontendUrl',
                )}/users/${id}/sessions`,
              },
            });
        }
      }
    }
    if (!usedBackupCode) throw new UnauthorizedException(INVALID_MFA_CODE);
    return this.loginResponse(ipAddress, userAgent, user);
  }

  private async getAccessToken(user: User): Promise<string> {
    const scopes = await this.getScopes(user);
    const payload: AccessTokenClaims = {
      id: user.id,
      scopes,
    };
    return this.tokensService.signJwt(
      LOGIN_ACCESS_TOKEN,
      payload,
      this.configService.get<string>('security.accessTokenExpiry'),
    );
  }

  private async loginResponse(
    ipAddress: string,
    userAgent: string,
    user: User,
  ): Promise<TokenResponse> {
    const token = this.tokensService.generateUuid();
    const ua = new UAParser(userAgent);
    const location = await this.geolocationService.getLocation(ipAddress);
    await this.prisma.session.create({
      data: {
        token,
        ipAddress,
        city: location?.city?.names?.en,
        region: location?.subdivisions?.pop()?.names?.en,
        timezone: location?.location?.time_zone,
        countryCode: location?.country?.iso_code,
        userAgent,
        browser:
          `${ua.getBrowser().name ?? ''} ${
            ua.getBrowser().version ?? ''
          }`.trim() || undefined,
        operatingSystem:
          `${ua.getOS().name ?? ''} ${ua.getOS().version ?? ''}`
            .replace('Mac OS', 'macOS')
            .trim() || undefined,
        user: { connect: { id: user.id } },
      },
    });
    return {
      accessToken: await this.getAccessToken(user),
      refreshToken: token,
    };
  }

  private async mfaResponse(
    user: User & {
      prefersEmail: Email;
    },
    forceMethod?: MfaMethod,
  ): Promise<TotpTokenResponse> {
    const mfaTokenPayload: MfaTokenPayload = {
      type: user.twoFactorMethod,
      id: user.id,
    };
    const totpToken = this.tokensService.signJwt(
      MULTI_FACTOR_TOKEN,
      mfaTokenPayload,
      this.configService.get<string>('security.mfaTokenExpiry'),
    );
    if (user.twoFactorMethod === 'EMAIL' || forceMethod === 'EMAIL') {
      this.email.send({
        to: `"${user.name}" <${user.prefersEmail.email}>`,
        template: 'auth/mfa-code',
        data: {
          name: user.name,
          minutes: parseInt(
            this.configService.get<string>('security.mfaTokenExpiry') ?? '',
          ),
          link: `${this.configService.get<string>(
            'frontendUrl',
          )}/auth/link/login%2Ftoken?token=${this.tokensService.signJwt(
            EMAIL_MFA_TOKEN,
            { id: user.id },
            '30m',
          )}`,
        },
      });
    } else if (user.twoFactorMethod === 'SMS' || forceMethod === 'SMS') {
      if (!user.twoFactorPhone)
        throw new BadRequestException(MFA_PHONE_NOT_FOUND);
      this.twilioService.send({
        to: user.twoFactorPhone,
        body: `${this.getOneTimePassword(user.twoFactorSecret)} is your ${
          this.configService.get<string>('meta.appName') ?? ''
        } verification code.`,
      });
    }
    return { totpToken, type: user.twoFactorMethod, multiFactorRequired: true };
  }

  private async checkLoginSubnet(
    ipAddress: string,
    _: string, // userAgent
    checkLocationOnLogin: boolean,
    id: number,
  ): Promise<void> {
    if (!checkLocationOnLogin) return;
    const subnet = anonymize(ipAddress);
    const previousSubnets = await this.prisma.approvedSubnet.findMany({
      where: { user: { id } },
    });
    let isApproved = false;
    for await (const item of previousSubnets) {
      if (!isApproved)
        if (await compare(subnet, item.subnet)) isApproved = true;
    }
    if (!isApproved) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { name: true, prefersEmail: true },
      });
      if (!user) throw new NotFoundException(USER_NOT_FOUND);
      const location = await this.geolocationService.getLocation(ipAddress);
      const locationName =
        [
          location?.city?.names?.en,
          (location?.subdivisions ?? [])[0]?.names?.en,
          location?.country?.names?.en,
        ]
          .filter((i) => i)
          .join(', ') || 'Unknown location';
      if (user.prefersEmail)
        this.email.send({
          to: `"${user.name}" <${user.prefersEmail.email}>`,
          template: 'auth/approve-subnets',
          data: {
            name: user.name,
            locationName,
            minutes: 30,
            link: `${this.configService.get<string>(
              'frontendUrl',
            )}/auth/link/reset-password?token=${this.tokensService.signJwt(
              APPROVE_SUBNET_TOKEN,
              { id },
              '30m',
            )}`,
          },
        });
      throw new UnauthorizedException(UNVERIFIED_LOCATION);
    }
  }

  async hashAndValidatePassword(
    password: string,
    ignorePwnedPassword: boolean,
  ): Promise<string> {
    if (!ignorePwnedPassword) {
      if (!this.configService.get<boolean>('security.passwordPwnedCheck'))
        return await hash(
          password,
          this.configService.get<number>('security.saltRounds') ?? 10,
        );
      if (!(await this.pwnedService.isPasswordSafe(password)))
        throw new BadRequestException(COMPROMISED_PASSWORD);
    }
    return await hash(
      password,
      this.configService.get<number>('security.saltRounds') ?? 10,
    );
  }

  async getScopes(user: User): Promise<string[]> {
    const scopes: string[] = [`user-${user.id}:*`];
    const memberships = await this.prisma.membership.findMany({
      where: { user: { id: user.id } },
      select: { id: true, role: true, group: { select: { id: true } } },
    });
    for await (const membership of memberships) {
      scopes.push(`membership-${membership.id}:*`);
      const ids = [
        membership.group.id,
        ...(await this.recursivelyGetSubgroupIds(membership.group.id)),
      ];

      ids.forEach((id) => {
        if (membership.role === 'OWNER') scopes.push(`group-${id}:*`);
        // Admins cannot delete a group, but they can read/write
        if (membership.role === 'ADMIN') scopes.push(`group-${id}:write-*`);
        // Non-owners (admins and regular members) can also read
        if (membership.role !== 'OWNER') scopes.push(`group-${id}:read-*`);
      });
    }
    return scopes;
  }

  private async recursivelyGetSubgroupIds(groupId: number) {
    const subgroups = await this.prisma.group.findMany({
      where: { parent: { id: groupId } },
      select: {
        id: true,
        parent: { select: { id: true } },
        subgroups: { select: { id: true } },
      },
    });
    const ids = subgroups.map((i) => i.id);
    for await (const group of subgroups) {
      for await (const subgroup of group.subgroups) {
        const recurisiveIds = await this.recursivelyGetSubgroupIds(subgroup.id);
        ids.push(...recurisiveIds);
      }
    }
    return ids;
  }

  async mergeUsers(token: string): Promise<{ success: true }> {
    let baseUserId: number | undefined = undefined;
    let mergeUserId: number | undefined = undefined;
    try {
      const result = this.tokensService.verify<{
        baseUserId: number;
        mergeUserId: number;
      }>(MERGE_ACCOUNTS_TOKEN, token);
      baseUserId = result.baseUserId;
      mergeUserId = result.mergeUserId;
    } catch (error) {}
    if (!baseUserId || !mergeUserId)
      throw new BadRequestException(USER_NOT_FOUND);
    return this.merge(baseUserId, mergeUserId);
  }

  private async merge(
    baseUserId: number,
    mergeUserId: number,
  ): Promise<{ success: true }> {
    const baseUser = await this.prisma.user.findUnique({
      where: { id: baseUserId },
    });
    const mergeUser = await this.prisma.user.findUnique({
      where: { id: mergeUserId },
    });
    if (!baseUser || !mergeUser) throw new NotFoundException(USER_NOT_FOUND);

    const combinedUser: Record<string, any> = {};
    [
      'checkLocationOnLogin',
      'countryCode',
      'gender',
      'name',
      'notificationEmails',
      'active',
      'prefersLanguage',
      'prefersColorScheme',
      'prefersReducedMotion',
      'profilePictureUrl',
      'role',
      'timezone',
      'twoFactorMethod',
      'twoFactorPhone',
      'twoFactorSecret',
      'attributes',
    ].forEach((key) => {
      if (mergeUser[key] != null) combinedUser[key] = mergeUser[key];
    });
    await this.prisma.user.update({
      where: { id: baseUserId },
      data: combinedUser,
    });

    for await (const dataType of [
      this.prisma.membership,
      this.prisma.email,
      this.prisma.session,
      this.prisma.approvedSubnet,
      this.prisma.backupCode,
      this.prisma.identity,
      this.prisma.auditLog,
      this.prisma.apiKey,
    ]) {
      for await (const item of await (dataType as Prisma.EmailDelegate).findMany(
        {
          where: { user: { id: mergeUserId } },
          select: { id: true },
        },
      ))
        await (dataType as Prisma.EmailDelegate).update({
          where: { id: item.id },
          data: { user: { connect: { id: baseUserId } } },
        });
    }

    await this.prisma.user.delete({ where: { id: mergeUser.id } });
    return { success: true };
  }
}
