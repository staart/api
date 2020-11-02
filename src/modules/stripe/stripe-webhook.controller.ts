import { Body, Controller, Headers, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { StripeService } from './stripe.service';

@Controller('webhooks/stripe')
@Public()
export class StripeWebhookController {
  constructor(private stripeService: StripeService) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() raw: Buffer,
  ): Promise<{ received: true }> {
    return this.stripeService.handleWebhook(signature, raw);
  }
}
