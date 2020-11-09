import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../providers/mail/mail.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { UserController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, ConfigModule, TokensModule],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
