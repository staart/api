import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
