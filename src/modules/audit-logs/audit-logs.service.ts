import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  auditLogs,
  auditLogsOrderByInput,
  auditLogsWhereInput,
  auditLogsWhereUniqueInput,
} from '@prisma/client';
import { UNAUTHORIZED_RESOURCE } from 'src/errors/errors.constants';
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
      cursor?: auditLogsWhereUniqueInput;
      where?: auditLogsWhereInput;
      orderBy?: auditLogsOrderByInput;
    },
  ): Promise<Expose<auditLogs>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const auditLogs = await this.prisma.auditLogs.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return auditLogs.map((group) => this.prisma.expose<auditLogs>(group));
  }

  async getAuditLog(groupId: number, id: number): Promise<Expose<auditLogs>> {
    const auditLog = await this.prisma.auditLogs.findOne({
      where: { id },
    });
    if (!auditLog) throw new NotFoundException(UNAUTHORIZED_RESOURCE);
    if (auditLog.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<auditLogs>(auditLog);
  }
}
