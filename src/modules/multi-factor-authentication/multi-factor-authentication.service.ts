import { BadRequestException, Injectable } from '@nestjs/common';
import { users } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MultiFactorAuthenticationService {
  constructor(private prisma: PrismaService, private auth: AuthService) {}

  async requestTwoFactorAuthentication(userId: number): Promise<string> {
    const enabled = await this.prisma.users.findOne({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    if (enabled.twoFactorEnabled)
      throw new BadRequestException(
        'Two-factor authentication is already enabled',
      );
    return this.auth.getTotpQrCode(userId);
  }

  async enableTwoFactorAuthentication(
    userId: number,
    token: string,
  ): Promise<Expose<users>> {
    return this.auth.enableTotp(userId, token);
  }

  async disableTwoFactorAuthentication(userId: number): Promise<Expose<users>> {
    const enabled = await this.prisma.users.findOne({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    if (!enabled.twoFactorEnabled)
      throw new BadRequestException('Two-factor authentication is not enabled');
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return this.prisma.expose<users>(user);
  }
}
