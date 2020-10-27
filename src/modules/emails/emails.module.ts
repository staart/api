import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PwnedModule } from '../pwned/pwned.module';
import { UsersService } from '../users/users.service';
import { EmailController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,
    PwnedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'staart',
    }),
  ],
  controllers: [EmailController],
  providers: [EmailsService, UsersService, AuthService],
})
export class EmailsModule {}
