import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';
import { hash } from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MultiFactorAuthenticationService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private configService: ConfigService,
  ) {}

  async requestTotpMfa(userId: number): Promise<string> {
    const enabled = await this.prisma.users.findOne({
      where: { id: userId },
      select: { twoFactorMethod: true },
    });
    if (!enabled) throw new NotFoundException('User not found');
    if (enabled.twoFactorMethod !== 'NONE')
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    return this.auth.getTotpQrCode(userId);
  }

  async enableTotpMfa(userId: number, token: string): Promise<string[]> {
    await this.auth.enableTotp(userId, token);
    return this.regenerateBackupCodes(userId);
  }

  async disableTotpMfa(userId: number): Promise<Expose<users>> {
    const enabled = await this.prisma.users.findOne({
      where: { id: userId },
      select: { twoFactorMethod: true },
    });
    if (!enabled) throw new NotFoundException('User not found');
    if (enabled.twoFactorMethod === 'NONE')
      throw new BadRequestException('Two-factor authentication is not enabled');
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { twoFactorMethod: 'NONE', twoFactorSecret: null },
    });
    return this.prisma.expose<users>(user);
  }

  async regenerateBackupCodes(id: number) {
    await this.prisma.backupCodes.deleteMany({ where: { user: { id } } });
    const codes: string[] = [];
    for await (const _ of [...Array(10)]) {
      const unsafeCode = randomStringGenerator();
      codes.push(unsafeCode);
      const code = await hash(
        unsafeCode,
        this.configService.get<number>('security.saltRounds') ?? 10,
      );
      await this.prisma.backupCodes.create({
        data: { user: { connect: { id } }, code },
      });
    }
    return codes;
  }
}
