import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { AuthService } from '../auth/auth.service';
import { MailModule } from '../../providers/mail/mail.module';
import { GeolocationService } from '../../providers/geolocation/geolocation.service';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { PwnedModule } from '../../providers/pwned/pwned.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { TwilioModule } from '../../providers/twilio/twilio.module';
import { UsersService } from '../users/users.service';
import { EmailController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    ConfigModule,
    TwilioModule,
    PwnedModule,
    TokensModule,
  ],
  controllers: [EmailController],
  providers: [
    EmailsService,
    UsersService,
    AuthService,
    GeolocationService,
    ApprovedSubnetsService,
  ],
})
export class EmailsModule {}
