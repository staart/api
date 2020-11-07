import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { STAART_AUDIT_LOG_DATA } from 'src/modules/audit-logs/audit-log.constants';
import { UserRequest } from 'src/modules/auth/auth.interface';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

@Injectable()
export class AuditLogger implements NestInterceptor {
  logger = new Logger('audit-logs');

  constructor(
    private readonly reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...', context.getClass());
    let auditLog = this.reflector.get<string | string[]>(
      STAART_AUDIT_LOG_DATA,
      context.getHandler(),
    );
    return next.handle().pipe(
      tap(() => {
        (async () => {
          if (auditLog) {
            console.log('Doing audit log', auditLog);
            if (typeof auditLog === 'string') auditLog = [auditLog];
            const request = context.switchToHttp().getRequest() as UserRequest;
            const groupId = parseInt(request.params.id);
            if (isNaN(groupId))
              throw new Error(`Group ID is not a number: ${request.params.id}`);
            console.log(this.reflector);
            for await (const event of auditLog) {
              console.log('saving', {
                user: { connect: { id: request.user.id } },
                group: { connect: { id: groupId } },
                event,
              });
              // await this.prisma.auditLogs.create({
              //   data: {
              //     user: { connect: { id: request.user.id } },
              //     group: { connect: { id: 1 } },
              //     event,
              //   },
              // });
            }
          }
        })()
          .then(() => {})
          .catch((err) => this.logger.error('Unable to save audit log', err));
      }),
    );
  }
}
