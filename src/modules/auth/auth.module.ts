import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GeolocationModule } from '../../providers/geolocation/geolocation.module';
import { MailModule } from '../../providers/mail/mail.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { PwnedModule } from '../../providers/pwned/pwned.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { TwilioModule } from '../../providers/twilio/twilio.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApprovedSubnetsModule } from '../approved-subnets/approved-subnets.module';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaartStrategy } from './staart.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    MailModule,
    TokensModule,
    ConfigModule,
    PwnedModule,
    ApiKeysModule,
    TwilioModule,
    GeolocationModule,
    ApprovedSubnetsModule,
  ],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [AuthService, StaartStrategy, ApprovedSubnetsService],
})
export class AuthModule {}
