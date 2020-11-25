import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MfaMethod } from '@prisma/client';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import {
  MFA_ENABLED_CONFLICT,
  MFA_NOT_ENABLED,
  NO_EMAILS,
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MultiFactorAuthenticationService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private configService: ConfigService,
    private twilioService: TwilioService,
    private emailService: MailService,
    private tokensService: TokensService,
  ) {}

  async requestTotpMfa(userId: number): Promise<string> {
    const enabled = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethod: true },
    });
    if (!enabled) throw new NotFoundException(USER_NOT_FOUND);
    if (enabled.twoFactorMethod !== 'NONE')
      throw new ConflictException(MFA_ENABLED_CONFLICT);
    return this.auth.getTotpQrCode(userId);
  }

  async requestSmsMfa(userId: number, phone: string): Promise<void> {
    const enabled = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethod: true },
    });
    if (!enabled) throw new NotFoundException(USER_NOT_FOUND);
    if (enabled.twoFactorMethod !== 'NONE')
      throw new ConflictException(MFA_ENABLED_CONFLICT);
    const secret = this.tokensService.generateUuid();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorPhone: phone },
    });
    return this.twilioService.send({
      to: phone,
      body: `${this.auth.getOneTimePassword(secret)} is your ${
        this.configService.get<string>('meta.appName') ?? ''
      } verification code.`,
    });
  }

  async requestEmailMfa(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorMethod: true,
        prefersEmail: true,
        name: true,
        id: true,
      },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.twoFactorMethod !== 'NONE')
      throw new ConflictException(MFA_ENABLED_CONFLICT);
    const secret = this.tokensService.generateUuid();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
    if (!user.prefersEmail) throw new BadRequestException(NO_EMAILS);
    return this.emailService.send({
      to: `"${user.name}" <${user.prefersEmail.emailSafe}>`,
      template: 'auth/enable-email-mfa',
      data: {
        name: user.name,
        code: this.auth.getOneTimePassword(secret),
      },
    });
  }

  async enableMfa(
    method: MfaMethod,
    userId: number,
    token: string,
  ): Promise<string[]> {
    await this.auth.enableMfaMethod(method, userId, token);
    return this.regenerateBackupCodes(userId);
  }

  async disableMfa(userId: number): Promise<Expose<User>> {
    const enabled = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethod: true },
    });
    if (!enabled) throw new NotFoundException(USER_NOT_FOUND);
    if (enabled.twoFactorMethod === 'NONE')
      throw new BadRequestException(MFA_NOT_ENABLED);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorMethod: 'NONE', twoFactorSecret: null },
    });
    return this.prisma.expose<User>(user);
  }

  async regenerateBackupCodes(id: number) {
    await this.prisma.backupCode.deleteMany({ where: { user: { id } } });
    const codes: string[] = [];
    for await (const _ of [...Array(10)]) {
      const unsafeCode = this.tokensService.generateUuid();
      codes.push(unsafeCode);
      const code = await hash(
        unsafeCode,
        this.configService.get<number>('security.saltRounds') ?? 10,
      );
      await this.prisma.backupCode.create({
        data: { user: { connect: { id } }, code },
      });
    }
    return codes;
  }
}
