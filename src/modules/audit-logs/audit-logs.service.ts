import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  auditLogs,
  auditLogsOrderByInput,
  auditLogsWhereInput,
  auditLogsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

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
    if (!auditLog)
      throw new HttpException('AuditLog not found', HttpStatus.NOT_FOUND);
    if (auditLog.groupId !== groupId) throw new UnauthorizedException();
    return this.prisma.expose<auditLogs>(auditLog);
  }
}
