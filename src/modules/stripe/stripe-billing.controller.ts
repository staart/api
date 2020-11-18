import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import Stripe from 'stripe';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import {
  CreateBillingDto,
  ReplaceBillingDto,
  UpdateBillingDto,
} from './stripe.dto';
import { StripeService } from './stripe.service';

@Controller('groups/:groupId/billing')
export class StripeBillingController {
  constructor(private stripeService: StripeService) {}

  @Post()
  @AuditLog('create-billing')
  @Scopes('group-{groupId}:write-billing')
  async createBillingAccount(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateBillingDto,
  ): Promise<Stripe.Customer> {
    return this.stripeService.createCustomer(groupId, data);
  }

  @Get()
  @Scopes('group-{groupId}:read-billing')
  async getBillingAccount(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Stripe.Customer> {
    return this.stripeService.getCustomer(groupId);
  }

  @Patch()
  @AuditLog('update-billing')
  @Scopes('group-{groupId}:write-billing')
  async updateBillingAccount(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: UpdateBillingDto,
  ): Promise<Stripe.Customer> {
    return this.stripeService.updateCustomer(groupId, data);
  }

  @Put()
  @AuditLog('update-billing')
  @Scopes('group-{groupId}:write-billing')
  async replaceBillingAccount(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: ReplaceBillingDto,
  ): Promise<Stripe.Customer> {
    return this.stripeService.updateCustomer(groupId, data);
  }

  @Delete()
  @AuditLog('delete-billing')
  @Scopes('group-{groupId}:delete-billing')
  async deleteBillingAccount(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Stripe.DeletedCustomer> {
    return this.stripeService.deleteCustomer(groupId);
  }

  @Get('link')
  @AuditLog('billing-portal')
  @Scopes('group-{groupId}:write-billing')
  async getSession(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Stripe.Response<Stripe.BillingPortal.Session>> {
    return this.stripeService.getBillingPortalLink(groupId);
  }
}
