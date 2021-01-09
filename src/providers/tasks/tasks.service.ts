import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Configuration } from '../../config/configuration.interface';
import { DomainsService } from '../../modules/domains/domains.service';
import { MetricsService } from '../../modules/metrics/metrics.service';
import { UsersService } from '../../modules/users/users.service';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private elasticSearchService: ElasticSearchService,
    private domainsService: DomainsService,
    private usersService: UsersService,
    private metricsService: MetricsService,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async updateMetrics() {
    await this.metricsService.updateProcessMetrics();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  async deleteOldSessions() {
    const now = new Date();
    const unusedRefreshTokenExpiryDays =
      this.configService.get<number>('security.unusedRefreshTokenExpiryDays') ??
      30;
    now.setDate(now.getDate() - unusedRefreshTokenExpiryDays);
    const deleted = await this.prisma.session.deleteMany({
      where: { updatedAt: { lte: now } },
    });
    if (deleted.count)
      this.logger.debug(`Deleted ${deleted.count} expired sessions`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async deleteInactiveUsers() {
    const now = new Date();
    const inactiveUserDeleteDays =
      this.configService.get<number>('security.inactiveUserDeleteDays') ?? 30;
    now.setDate(now.getDate() - inactiveUserDeleteDays);
    const deleted = await this.prisma.user.findMany({
      select: { id: true },
      where: {
        active: false,
        sessions: { every: { updatedAt: { lte: now } } },
      },
    });
    if (deleted.length) {
      for await (const user of deleted)
        await this.usersService.deleteUser(user.id);
      this.logger.debug(`Deleted ${deleted.length} inactive users`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3PM)
  async deleteOldLogs() {
    const tracking = this.configService.get<Configuration['tracking']>(
      'tracking',
    );
    if (tracking.deleteOldLogs)
      return this.elasticSearchService.deleteOldRecords(
        tracking.index,
        tracking.deleteOldLogsDays,
      );
  }

  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  async verifyDomains() {
    const domains = await this.prisma.domain.findMany({
      where: { isVerified: false },
    });
    for await (const domain of domains) {
      try {
        await this.domainsService.verifyDomain(domain.groupId, domain.id);
      } catch (error) {}
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async deleteOldAuditLogs() {
    const now = new Date();
    now.setDate(now.getDate() - 90);
    const deleted = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lte: now } },
    });
    if (deleted.count) this.logger.debug(`Deleted ${deleted.count} audit logs`);
  }
}
