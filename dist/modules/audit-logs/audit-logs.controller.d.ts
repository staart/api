import { AuditLog } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogController {
    private auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    getAll(groupId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<AuditLog>[]>;
    get(groupId: number, id: number): Promise<Expose<AuditLog>>;
}
