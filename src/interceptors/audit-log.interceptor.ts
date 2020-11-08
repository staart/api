import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { auditLogsCreateInput } from '@prisma/client';
import { getClientIp } from 'request-ip';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { STAART_AUDIT_LOG_DATA } from 'src/modules/audit-logs/audit-log.constants';
import { UserRequest } from 'src/modules/auth/auth.interface';
import { GeolocationService } from 'src/modules/geolocation/geolocation.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { WebhooksService } from 'src/modules/webhooks/webhooks.service';
import { UAParser } from 'ua-parser-js';

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
            const groupId = parseInt(request.params.id);
            if (isNaN(groupId))
              throw new Error(`Group ID is not a number: ${request.params.id}`);
            const ip = getClientIp(request);
            const location = await this.geolocationService.getLocation(ip);
            const userAgent = request.get('user-agent');
            const ua = new UAParser(userAgent);
            for await (const event of auditLog) {
              const data: auditLogsCreateInput = {
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
                  `${ua.getOS().name ?? ''} ${
                    ua.getOS().version ?? ''
                  }`.trim() || undefined,
              };
              if (request.user.id && request.user.type === 'user')
                data.user = { connect: { id: request.user.id } };
              if (groupId) data.group = { connect: { id: groupId } };
              await this.prisma.auditLogs.create({ data });
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
