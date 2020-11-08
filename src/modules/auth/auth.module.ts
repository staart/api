import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApprovedSubnetsModule } from '../approved-subnets/approved-subnets.module';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { EmailModule } from '../email/email.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PwnedModule } from '../pwned/pwned.module';
import { TokensModule } from '../tokens/tokens.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaartStrategy } from './staart.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    EmailModule,
    TokensModule,
    ConfigModule,
    PwnedModule,
    ApiKeysModule,
    GeolocationModule,
    ApprovedSubnetsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'staart',
    }),
  ],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [AuthService, StaartStrategy, ApprovedSubnetsService],
})
export class AuthModule {}
