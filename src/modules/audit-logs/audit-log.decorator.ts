import { SetMetadata } from '@nestjs/common';
import { STAART_AUDIT_LOG_DATA } from './audit-log.constants';

export const AuditLog = (...value: string[]) =>
  SetMetadata(STAART_AUDIT_LOG_DATA, value);
