import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AuditLog } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { Scopes } from '../auth/scope.decorator';
import { AuditLogsService } from './audit-logs.service';

@Controller('groups/:groupId/audit-logs')
export class AuditLogGroupController {
  constructor(private auditLogsService: AuditLogsService) {}

  /** Get audit logs for a group */
  @Get()
  @Scopes('group-{groupId}:read-audit-log-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<AuditLog>[]> {
    return this.auditLogsService.getAuditLogs({
      skip,
      take,
      orderBy,
      cursor,
      where: { ...where, group: { id: groupId } },
    });
  }
}
