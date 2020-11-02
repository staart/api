import { Body, Controller, Headers, Post } from '@nestjs/common';
import Stripe from 'stripe';
import { Public } from '../auth/public.decorator';
import { StripeService } from './stripe.service';

@Controller('webhooks/stripe')
@Public()
export class StripeWebhookController {
  constructor(private stripeService: StripeService) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() event: Stripe.Event,
  ): Promise<void> {
    return this.stripeService.handleWebhook(signature, event);
  }
}
