import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiFactorAuthenticationController } from './multi-factor-authentication.controller';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MultiFactorAuthenticationController],
  providers: [MultiFactorAuthenticationService],
})
export class MultiFactorAuthenticationModule {}
