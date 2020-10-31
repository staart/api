import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  async deleteOldSessions() {
    const now = new Date();
    const unusedRefreshTokenExpiryDays =
      this.configService.get<number>('security.unusedRefreshTokenExpiryDays') ??
      30;
    now.setDate(now.getDate() - unusedRefreshTokenExpiryDays);
    const deleted = await this.prisma.sessions.deleteMany({
      where: { updatedAt: { lte: now } },
    });
    if (deleted.count)
      this.logger.debug(`Deleted ${deleted.count} expired sessions`);
  }
}
