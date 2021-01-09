import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AuditLogger } from './interceptors/audit-log.interceptor';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { ApiLoggerMiddleware } from './middleware/api-logger.middleware';
import { JsonBodyMiddleware } from './middleware/json-body.middleware';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ApprovedSubnetsModule } from './modules/approved-subnets/approved-subnets.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { ScopesGuard } from './modules/auth/scope.guard';
import { StaartAuthGuard } from './modules/auth/staart-auth.guard';
import { DomainsModule } from './modules/domains/domains.module';
import { EmailsModule } from './modules/emails/emails.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { MultiFactorAuthenticationModule } from './modules/multi-factor-authentication/multi-factor-authentication.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CloudinaryModule } from './providers/cloudinary/cloudinary.module';
import { DnsModule } from './providers/dns/dns.module';
import { ElasticSearchModule } from './providers/elasticsearch/elasticsearch.module';
import { GeolocationModule } from './providers/geolocation/geolocation.module';
import { GitHubModule } from './providers/github/github.module';
import { GoogleMapsModule } from './providers/google-maps/google-maps.module';
import { MailModule } from './providers/mail/mail.module';
import { PuppeteerModule } from './providers/puppeteer/puppeteer.module';
import { PrismaModule } from './providers/prisma/prisma.module';
import { S3Module } from './providers/s3/s3.module';
import { SlackModule } from './providers/slack/slack.module';
import { TasksModule } from './providers/tasks/tasks.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MetaModule } from './modules/meta/meta.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TasksModule,
    UsersModule,
    AuthModule,
    MailModule,
    SessionsModule,
    EmailsModule,
    GroupsModule,
    MultiFactorAuthenticationModule,
    ApiKeysModule,
    ApprovedSubnetsModule,
    DomainsModule,
    DnsModule,
    GeolocationModule,
    MembershipsModule,
    StripeModule,
    AuditLogsModule,
    WebhooksModule,
    ElasticSearchModule,
    SlackModule,
    S3Module,
    CloudinaryModule,
    GitHubModule,
    GoogleMapsModule,
    PuppeteerModule,
    MetricsModule,
    MetaModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: StaartAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ScopesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogger,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({
        path: '/webhooks/stripe',
        method: RequestMethod.POST,
      })
      .apply(JsonBodyMiddleware)
      .forRoutes('*')
      .apply(ApiLoggerMiddleware)
      .forRoutes('*');
  }
}
