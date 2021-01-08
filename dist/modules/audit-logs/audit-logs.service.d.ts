import type { Prisma } from '@prisma/client';
import { AuditLog } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAuditLogs(groupId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.AuditLogWhereUniqueInput;
        where?: Prisma.AuditLogWhereInput;
        orderBy?: Prisma.AuditLogOrderByInput;
    }): Promise<Expose<AuditLog>[]>;
    getAuditLog(groupId: number, id: number): Promise<Expose<AuditLog>>;
}
