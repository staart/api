import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RateLimiterInterceptor, RateLimiterModule } from 'nestjs-rate-limiter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { AccessTokensModule } from './modules/access-tokens/access-tokens.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { ScopesGuard } from './modules/auth/scope.guard';
import { EmailModule } from './modules/email/email.module';
import { EmailsModule } from './modules/emails/emails.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
