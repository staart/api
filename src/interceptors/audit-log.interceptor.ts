import {
  BadGatewayException,
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Prisma } from '@prisma/client';
import { getClientIp } from 'request-ip';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UAParser } from 'ua-parser-js';
import { GROUP_NOT_FOUND } from '../errors/errors.constants';
import { STAART_AUDIT_LOG_DATA } from '../modules/audit-logs/audit-log.constants';
import { UserRequest } from '../modules/auth/auth.interface';
import { WebhooksService } from '../modules/webhooks/webhooks.service';
import { GeolocationService } from '../providers/geolocation/geolocation.service';
import { PrismaService } from '../providers/prisma/prisma.service';

@Injectable()
export class AuditLogger implements NestInterceptor {
  logger = new Logger(AuditLogger.name);

  constructor(
    private readonly reflector: Reflector,
    private prisma: PrismaService,
    private geolocationService: GeolocationService,
    private webhooksService: WebhooksService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let auditLog = this.reflector.get<string | string[]>(
      STAART_AUDIT_LOG_DATA,
      context.getHandler(),
    );
    return next.handle().pipe(
      tap(() => {
        (async () => {
          if (auditLog) {
            if (typeof auditLog === 'string') auditLog = [auditLog];
            const request = context.switchToHttp().getRequest() as UserRequest;
            const groupId = parseInt(request.params.groupId);
            if (isNaN(groupId)) throw new BadGatewayException(GROUP_NOT_FOUND);
            const ip = getClientIp(request);
            const location = await this.geolocationService.getLocation(ip);
            const userAgent = request.get('user-agent');
            const ua = new UAParser(userAgent);
            for await (const event of auditLog) {
              const data: Prisma.AuditLogCreateInput = {
                event,
                city: location?.city?.names?.en,
                region: location?.subdivisions?.pop()?.names?.en,
                timezone: location?.location?.time_zone,
                countryCode: location?.country?.iso_code,
                userAgent,
                browser:
                  `${ua.getBrowser().name ?? ''} ${
                    ua.getBrowser().version ?? ''
                  }`.trim() || undefined,
                operatingSystem:
                  `${ua.getOS().name ?? ''} ${ua.getOS().version ?? ''}`
                    .replace('Mac OS', 'macOS')
                    .trim() || undefined,
              };
              if (request.user.id && request.user.type === 'user')
                data.user = { connect: { id: request.user.id } };
              if (groupId) data.group = { connect: { id: groupId } };
              await this.prisma.auditLog.create({ data });
              this.webhooksService.triggerWebhook(groupId, event);
            }
          }
        })()
          .then(() => {})
          .catch((err) => this.logger.error('Unable to save audit log', err));
      }),
    );
  }
}
