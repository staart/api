import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { Expose } from 'src/modules/prisma/prisma.interface';
import Stripe from 'stripe';
import { Scopes } from '../auth/scope.decorator';
import { UpdateBillingDto } from './stripe.dto';
import { StripeService } from './stripe.service';

@Controller('groups/:groupId/billing')
export class StripeBillingController {
  constructor(private stripeService: StripeService) {}

  @Get()
  @Scopes('group-{groupId}:read-billing')
  async billingInfo(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Expose<Stripe.Customer>> {
    return this.stripeService.getCustomer(groupId);
  }

  @Patch()
  @Scopes('group-{groupId}:write-billing')
  async updateBillingInfo(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: UpdateBillingDto,
  ): Promise<Expose<Stripe.Customer>> {
    return this.stripeService.updateCustomer(groupId, data);
  }
}
