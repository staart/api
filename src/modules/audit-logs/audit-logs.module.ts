import { Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuditLogController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
