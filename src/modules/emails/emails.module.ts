import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { AuthService } from '../auth/auth.service';
import { EmailModule } from '../email/email.module';
import { GeolocationService } from '../geolocation/geolocation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PwnedModule } from '../pwned/pwned.module';
import { TokensModule } from '../tokens/tokens.module';
import { TwilioModule } from '../twilio/twilio.module';
import { UsersService } from '../users/users.service';
import { EmailController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,
    TwilioModule,
    PwnedModule,
    TokensModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'staart',
    }),
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
