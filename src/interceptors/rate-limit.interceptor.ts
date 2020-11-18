import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getClientIp } from 'request-ip';
import { Observable } from 'rxjs';
import { Configuration } from '../config/configuration.interface';
import { RATE_LIMIT_EXCEEDED } from '../errors/errors.constants';
import { UserRequest } from '../modules/auth/auth.interface';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private rateLimiterPublic = new RateLimiterMemory(
    this.configService.get<Configuration['rateLimit']['public']>(
      'rateLimit.public',
    ),
  );
  private rateLimiterAuthenticated = new RateLimiterMemory(
    this.configService.get<Configuration['rateLimit']['authenticated']>(
      'rateLimit.authenticated',
    ),
  );
  private rateLimiterApiKey = new RateLimiterMemory(
    this.configService.get<Configuration['rateLimit']['apiKey']>(
      'rateLimit.apiKey',
    ),
  );

  constructor(
    private readonly reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const points =
      this.reflector.get<number>('rateLimit', context.getHandler()) ?? 1;
    const request = context.switchToHttp().getRequest() as UserRequest;
    const response = context.switchToHttp().getResponse();
    let limiter = this.rateLimiterPublic;
    if (request.user?.type === 'api-key') limiter = this.rateLimiterApiKey;
    else if (request.user?.type === 'user')
      limiter = this.rateLimiterAuthenticated;
    try {
      const ip = getClientIp(request);
      const result = await limiter.consume(ip.replace(/^.*:/, ''), points);
      response.header('Retry-After', Math.ceil(result.msBeforeNext / 1000));
      response.header('X-RateLimit-Limit', points);
      response.header('X-Retry-Remaining', result.remainingPoints);
      response.header(
        'X-Retry-Reset',
        new Date(Date.now() + result.msBeforeNext).toUTCString(),
      );
    } catch (result) {
      response.header('Retry-After', Math.ceil(result.msBeforeNext / 1000));
      throw new HttpException(
        RATE_LIMIT_EXCEEDED,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return next.handle();
  }
}
