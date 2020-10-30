import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Authenticator } from '@otplib/core';
import { emails, users } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { safeEmail } from 'src/helpers/safe-email';
import { EmailService } from '../email/email.service';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { PwnedService } from '../pwned/pwned.service';
import {
  EMAIL_VERIFY_TOKEN,
  PASSWORD_RESET_TOKEN,
  TWO_FACTOR_TOKEN,
  APPROVE_SUBNET_TOKEN,
} from '../tokens/tokens.constants';
import { TokensService } from '../tokens/tokens.service';
import { RegisterDto } from './auth.dto';
import { AccessTokenClaims } from './auth.interface';
import anonymize from 'ip-anonymize';

@Injectable()
export class AuthService {
  authenticator: Authenticator;

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private pwnedService: PwnedService,
    private tokensService: TokensService,
  ) {
    this.authenticator = authenticator.create({
      window: [
        this.configService.get<number>('security.totpWindowPast'),
        this.configService.get<number>('security.totpWindowFuture'),
      ],
    });
  }

  async validateUser(email: string, password?: string): Promise<number> {
    const emailSafe = safeEmail(email);
    const user = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
      select: { id: true, password: true, emails: true },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!user.emails.find(i => i.emailSafe === emailSafe)?.isVerified)
      throw new UnauthorizedException('This email is not verified');
    if (!password || !user.password)
      throw new HttpException(
        'Logging in without passwords is not supported',
        HttpStatus.NOT_IMPLEMENTED,
      );
    if (await compare(password, user.password)) return user.id;
    return null;
  }

  async login(
    ipAddress: string,
    userAgent: string,
    email: string,
    password?: string,
    code?: string,
  ) {
    const id = await this.validateUser(email, password);
    if (!id) throw new UnauthorizedException();
    if (code) return this.loginUserWithTotpCode(ipAddress, userAgent, id, code);
    return this.loginResponse(ipAddress, userAgent, id);
  }

  async register(data: RegisterDto): Promise<Expose<users>> {
    const email = data.email;
    data.name = data.name
      .split(' ')
      .map((word, index) =>
        index === 0 || index === data.name.split(' ').length
          ? (word.charAt(0) ?? '').toUpperCase() +
            (word.slice(1) ?? '').toLowerCase()
          : word,
      )
      .join(' ');
    const emailSafe = safeEmail(email);
    const ignorePwnedPassword = !!data.ignorePwnedPassword;
    delete data.email;
    delete data.ignorePwnedPassword;
    data.password = await this.hashAndValidatePassword(
      data.password,
      ignorePwnedPassword,
    );

    const testUser = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
    });
    if (testUser)
      throw new HttpException(
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );

    const user = await this.prisma.users.create({
      data: {
        ...data,
        emails: {
          create: { email: email, emailSafe },
        },
      },
    });
    await this.sendEmailVerification(email);
    return this.prisma.expose(user);
  }

  async sendEmailVerification(email: string, resend = false) {
    const emailSafe = safeEmail(email);
    const emailDetails = await this.prisma.emails.findFirst({
      where: { emailSafe },
      include: { user: true },
    });
    if (!emailDetails)
      throw new HttpException(
        'There is no user for this email',
        HttpStatus.NOT_FOUND,
      );
    if (!emailDetails.isVerified)
      throw new HttpException(
        'This email is already verified',
        HttpStatus.BAD_REQUEST,
      );
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
        )}/auth/verify-email?token=${this.tokensService.signJwt(
          EMAIL_VERIFY_TOKEN,
          emailDetails.user.id,
          '7d',
        )}`,
      },
    });
    return { queued: true };
  }

  async refresh(ipAddress: string, userAgent: string, token: string) {
    if (!token) throw new UnprocessableEntityException();
    const session = await this.prisma.sessions.findFirst({
      where: { token },
      select: { user: { select: { id: true } } },
    });
    if (!session)
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    await this.prisma.sessions.updateMany({
      where: { token },
      data: { ipAddress, userAgent },
    });
    return {
      accessToken: await this.getAccessToken(session.user.id),
      refreshToken: token,
    };
  }

  async logout(token: string) {
    if (!token) throw new UnprocessableEntityException();
    const session = await this.prisma.sessions.findFirst({
      where: { token },
      select: { id: true, user: { select: { id: true } } },
    });
    if (!session)
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    await this.prisma.sessions.delete({
      where: { id: session.id },
    });
  }

  /** Get the two-factor authentication QR code */
  async getTotpQrCode(userId: number) {
    const secret = randomStringGenerator();
    await this.prisma.users.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    const otpauth = this.authenticator.keyuri(
      userId.toString(),
      this.configService.get<string>('meta.totpServiceName'),
      secret,
    );
    return qrcode.toDataURL(otpauth);
  }

  /** Enable two-factor authentication */
  async enableTotp(userId: number, code: string) {
    const user = await this.prisma.users.findOne({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) throw new NotFoundException();
    if (!user.twoFactorEnabled)
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    if (!this.authenticator.check(code, user.twoFactorSecret))
      throw new UnauthorizedException(
        'Two-factor authentication code is invalid',
      );
    const result = await this.prisma.users.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return this.prisma.expose<users>(result);
  }

  async loginWithTotp(
    ipAddress: string,
    userAgent: string,
    token: string,
    code: string,
  ) {
    const { id } = this.tokensService.verify<{ id: number }>(
      TWO_FACTOR_TOKEN,
      token,
    );
    return this.loginUserWithTotpCode(ipAddress, userAgent, id, code);
  }

  async requestPasswordReset(email: string) {
    const emailSafe = safeEmail(email);
    const emailDetails = await this.prisma.emails.findFirst({
      where: { emailSafe },
      include: { user: true },
    });
    if (!emailDetails)
      throw new HttpException(
        'There is no user for this email',
        HttpStatus.NOT_FOUND,
      );
    this.email.send({
      to: `"${emailDetails.user.name}" <${email}>`,
      template: 'auth/password-reset',
      data: {
        name: emailDetails.user.name,
        minutes: 30,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/auth/reset-password?token=${this.tokensService.signJwt(
          PASSWORD_RESET_TOKEN,
          emailDetails.user.id,
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
  ) {
    const id = this.tokensService.verify<number>(PASSWORD_RESET_TOKEN, token);
    password = await this.hashAndValidatePassword(
      password,
      !!ignorePwnedPassword,
    );
    await this.prisma.users.update({ where: { id }, data: { password } });
    return this.loginResponse(ipAddress, userAgent, id);
  }

  async verifyEmail(token: string) {
    const id = this.tokensService.verify<number>(EMAIL_VERIFY_TOKEN, token);
    const result = await this.prisma.emails.update({
      where: { id },
      data: { isVerified: true },
    });
    return this.prisma.expose<emails>(result);
  }

  private async loginUserWithTotpCode(
    ipAddress: string,
    userAgent: string,
    id: number,
    code: string,
  ) {
    const user = await this.prisma.users.findOne({
      where: { id },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        checkLocationOnLogin: true,
      },
    });
    if (!user) throw new NotFoundException();
    if (!user.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication is not enabled');
    if (!this.authenticator.check(code, user.twoFactorSecret))
      throw new UnauthorizedException(
        'Two-factor authentication code is invalid',
      );
    return this.loginResponse(ipAddress, userAgent, id);
  }

  private async getAccessToken(userId: number): Promise<string> {
    const scopes = await this.getScopes(userId);
    const payload: AccessTokenClaims = {
      sub: `user${userId}`,
      scopes,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('security.accessTokenExpiry'),
    });
  }

  private async loginResponse(
    ipAddress: string,
    userAgent: string,
    id: number,
  ) {
    const token = randomStringGenerator();
    await this.prisma.sessions.create({
      data: { token, ipAddress, userAgent, user: { connect: { id } } },
    });
    return {
      accessToken: await this.getAccessToken(id),
      refreshToken: token,
    };
  }

  private async checkLoginSubnet(
    ipAddress: string,
    _: string, // userAgent
    checkLocationOnLogin: boolean,
    id: number,
  ): Promise<void> {
    if (!checkLocationOnLogin) return;
    const subnet = anonymize(ipAddress);
    const isApproved = await this.prisma.approvedLocations.findFirst({
      where: { user: { id }, subnet },
    });
    if (!isApproved) {
      const user = await this.prisma.users.findOne({
        where: { id },
        select: { name: true, prefersEmail: true },
      });
      if (!user) throw new NotFoundException('User not found');
      this.email.send({
        to: `"${user.name}" <${user.prefersEmail.emailSafe}>`,
        template: 'auth/approve-subnets',
        data: {
          name: user.name,
          subnet,
          minutes: 30,
          link: `${this.configService.get<string>(
            'frontendUrl',
          )}/auth/reset-password?token=${this.tokensService.signJwt(
            APPROVE_SUBNET_TOKEN,
            id,
            '30m',
          )}`,
        },
      });
      throw new UnauthorizedException('Verify this location before logging in');
    }
  }

  async hashAndValidatePassword(
    password: string,
    ignorePwnedPassword: boolean,
  ): Promise<string> {
    if (!ignorePwnedPassword) {
      if (!this.configService.get<boolean>('security.passwordPwnedCheck'))
        return;
      if (!(await this.pwnedService.isPasswordSafe(password)))
        throw new HttpException(
          'This password has been compromised in a data breach.',
          HttpStatus.BAD_REQUEST,
        );
    }
    return await hash(
      password,
      this.configService.get<number>('security.saltRounds'),
    );
  }

  async getScopes(userId: number): Promise<string[]> {
    const scopes: string[] = [`user-${userId}:*`];
    const memberships = await this.prisma.memberships.findMany({
      where: { user: { id: userId } },
      select: { id: true, role: true, group: { select: { id: true } } },
    });
    memberships.forEach(membership => {
      scopes.push(`membership-${membership.id}:*`);
      if (membership.role === 'OWNER')
        scopes.push(`group-${membership.group.id}:*`);

      // Admins cannot delete a group, but they can read/write
      if (membership.role === 'ADMIN')
        scopes.push(`group-${membership.group.id}:write-*`);

      // Non-owners (admins and regular members) can also read
      if (membership.role !== 'OWNER')
        scopes.push(`group-${membership.group.id}:read-*`);
    });
    return scopes;
  }
}
