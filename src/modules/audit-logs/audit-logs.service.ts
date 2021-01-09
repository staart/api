import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditLog } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AuditLogWhereUniqueInput;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByInput;
  }): Promise<Expose<AuditLog>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    try {
      const AuditLog = await this.prisma.auditLog.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: { group: true, user: true },
      });
      return AuditLog.map((group) => this.prisma.expose<AuditLog>(group));
    } catch (error) {
      return [];
    }
  }
}
