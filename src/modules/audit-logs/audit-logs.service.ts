import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditLog } from '@prisma/client';
import { UNAUTHORIZED_RESOURCE } from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(
    groupId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.AuditLogWhereUniqueInput;
      where?: Prisma.AuditLogWhereInput;
      orderBy?: Prisma.AuditLogOrderByInput;
    },
  ): Promise<Expose<AuditLog>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const AuditLog = await this.prisma.auditLog.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return AuditLog.map((group) => this.prisma.expose<AuditLog>(group));
  }

  async getAuditLog(groupId: number, id: number): Promise<Expose<AuditLog>> {
    const AuditLog = await this.prisma.auditLog.findUnique({
      where: { id },
    });
    if (!AuditLog) throw new NotFoundException(UNAUTHORIZED_RESOURCE);
    if (AuditLog.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<AuditLog>(AuditLog);
  }
}
