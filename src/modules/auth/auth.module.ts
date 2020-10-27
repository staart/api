import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PwnedModule } from '../pwned/pwned.module';
import { TokensModule } from '../tokens/tokens.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    EmailModule,
    TokensModule,
    ConfigModule,
    PwnedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'staart',
    }),
  ],
  controllers: [AuthController],
  exports: [AuthService],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
