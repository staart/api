import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import Stripe from 'stripe';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { Scopes } from '../auth/scope.decorator';
import { StripeService } from './stripe.service';

@Controller('groups/:groupId/invoices')
export class StripeInvoicesController {
  constructor(private stripeService: StripeService) {}

  @Get()
  @Scopes('group-{groupId}:read-invoice-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: { id: string },
  ): Promise<Stripe.Invoice[]> {
    return this.stripeService.getInvoices(groupId, { take, cursor });
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-invoice-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id') id: string,
  ): Promise<Stripe.Invoice> {
    return this.stripeService.getInvoice(groupId, id);
  }
}
