import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokensModule } from '../tokens/tokens.module';
import { TwilioModule } from '../twilio/twilio.module';
import { MultiFactorAuthenticationController } from './multi-factor-authentication.controller';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TwilioModule,
    EmailModule,
    ConfigModule,
    TokensModule,
  ],
  controllers: [MultiFactorAuthenticationController],
  providers: [MultiFactorAuthenticationService],
})
export class MultiFactorAuthenticationModule {}
