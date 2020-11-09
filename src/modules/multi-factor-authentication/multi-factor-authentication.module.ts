import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../../providers/email/email.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { TwilioModule } from '../../providers/twilio/twilio.module';
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
