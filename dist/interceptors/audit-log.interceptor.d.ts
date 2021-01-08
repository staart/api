import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { WebhooksService } from '../modules/webhooks/webhooks.service';
import { GeolocationService } from '../providers/geolocation/geolocation.service';
import { PrismaService } from '../providers/prisma/prisma.service';
export declare class AuditLogger implements NestInterceptor {
    private readonly reflector;
    private prisma;
    private geolocationService;
    private webhooksService;
    logger: Logger;
    constructor(reflector: Reflector, prisma: PrismaService, geolocationService: GeolocationService, webhooksService: WebhooksService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
