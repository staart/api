import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { StripeBillingController } from './stripe-billing.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeSubscriptionController } from './stripe-subscription.controller';
import { StripeSourcesController } from './stripe-sources.controller';
import { StripeInvoicesController } from './stripe-invoices.controller';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [StripeService],
  exports: [StripeService],
  controllers: [
    StripeBillingController,
    StripeInvoicesController,
    StripeSourcesController,
    StripeSubscriptionController,
    StripeWebhookController,
  ],
})
export class StripeModule {}
