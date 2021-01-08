import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
export declare class RateLimitInterceptor implements NestInterceptor {
    private readonly reflector;
    private configService;
    private rateLimiterPublic;
    private rateLimiterAuthenticated;
    private rateLimiterApiKey;
    constructor(reflector: Reflector, configService: ConfigService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
