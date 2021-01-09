import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../providers/mail/mail.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { UserController } from './users.controller';
import { UsersService } from './users.service';
import { S3Module } from '../../providers/s3/s3.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MailModule,
    ConfigModule,
    TokensModule,
    S3Module,
    ApiKeysModule,
  ],
  controllers: [UserController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
