import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimiterInterceptor, RateLimiterModule } from 'nestjs-rate-limiter';
import configuration from './config/configuration';
import { AccessTokensModule } from './modules/access-tokens/access-tokens.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ApprovedSubnetsModule } from './modules/approved-subnets/approved-subnets.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { ScopesGuard } from './modules/auth/scope.guard';
import { DomainsModule } from './modules/domains/domains.module';
import { EmailModule } from './modules/email/email.module';
import { EmailsModule } from './modules/emails/emails.module';
import { GeolocationModule } from './modules/geolocation/geolocation.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MultiFactorAuthenticationModule } from './modules/multi-factor-authentication/multi-factor-authentication.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

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
    RateLimiterModule.register({
      points: 100,
      duration: 60,
    }),
    EmailModule,
    SessionsModule,
    AccessTokensModule,
    EmailsModule,
    GroupsModule,
    MultiFactorAuthenticationModule,
    ApiKeysModule,
    ApprovedSubnetsModule,
    DomainsModule,
    GeolocationModule,
    StripeModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimiterInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ScopesGuard,
    },
  ],
})
export class AppModule {}
