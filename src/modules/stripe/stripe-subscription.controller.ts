import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import Stripe from 'stripe';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import { StripeService } from './stripe.service';

@Controller('groups/:groupId/subscriptions')
export class StripeSubscriptionController {
  constructor(private stripeService: StripeService) {}

  /** Create a subscription for a group */
  @Post(':plan')
  @AuditLog('create-subscription')
  @Scopes('group-{groupId}:write-subscription-*')
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('plan') plan: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripeService.createSession(groupId, 'subscription', plan);
  }

  /** Get subscriptions for a group */
  @Get()
  @Scopes('group-{groupId}:read-subscription-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: { id: string },
  ): Promise<Stripe.Subscription[]> {
    return this.stripeService.getSubscriptions(groupId, { take, cursor });
  }

  /** Get a subscription for a group */
  @Get(':id')
  @Scopes('group-{groupId}:read-subscription-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id') id: string,
  ): Promise<Stripe.Subscription> {
    return this.stripeService.getSubscription(groupId, id);
  }

  /** Cancel a subscription for a group */
  @Delete(':id')
  @AuditLog('delete-subscription')
  @Scopes('group-{groupId}:delete-subscription-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id') id: string,
  ): Promise<Stripe.Subscription> {
    return this.stripeService.cancelSubscription(groupId, id);
  }

  /** Get subscription plans for a group */
  @Get('plans')
  @Scopes('group-{groupId}:write-subscription-*')
  async getPlans(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('product') product?: string,
  ): Promise<Stripe.Plan[]> {
    return this.stripeService.plans(groupId, product);
  }
}
