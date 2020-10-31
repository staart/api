import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeApiKey = this.configService.get<string>(
      'payments.stripeApiKey',
    );
    if (!stripeApiKey) throw new Error('Stripe API key not found');
    this.stripe = new Stripe(stripeApiKey, {
      apiVersion: '2020-08-27',
    });
  }

  async createCustomer(groupId: number, data: Stripe.CustomerCreateParams) {
    const group = await this.prisma.groups.findOne({
      where: { id: groupId },
      select: { attributes: true },
    });
    if (!group) throw new NotFoundException('Group not found');
    const attributes = group.attributes as { stripeCustomerId?: string };
    if (attributes?.stripeCustomerId)
      throw new BadRequestException('Billing account is already set up');
    const result = await this.stripe.customers.create(data);
    await this.prisma.groups.update({
      where: { id: groupId },
      data: { attributes: { stripeCustomerId: result.id } },
    });
    return result as Stripe.Response<Stripe.Customer>;
  }

  async getCustomer(groupId: number) {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.customers.retrieve(stripeId);
    if (result.deleted)
      throw new NotFoundException('This customer has been deleted');
    return result as Stripe.Response<Stripe.Customer>;
  }

  async updateCustomer(groupId: number, data: Stripe.CustomerUpdateParams) {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.customers.update(stripeId, data);
    return result as Stripe.Response<Stripe.Customer>;
  }

  async deleteCustomer(groupId: number): Promise<Stripe.DeletedCustomer> {
    const stripeId = await this.stripeId(groupId);
    const result = (await this.stripe.customers.del(
      stripeId,
    )) as Stripe.DeletedCustomer;
    await this.prisma.groups.update({
      where: { id: groupId },
      data: { attributes: { stripeCustomerId: null } },
    });
    return result;
  }

  async getInvoices(
    groupId: number,
    params: {
      take?: number;
      cursor?: { id: string };
    },
  ): Promise<Stripe.Invoice[]> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.invoices.list({
      customer: stripeId,
      limit: params.take,
      starting_after: params.cursor?.id,
    });
    return this.list<Stripe.Invoice>(result);
  }

  async getInvoice(
    groupId: number,
    invoiceId: string,
  ): Promise<Stripe.Invoice> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.invoices.retrieve(invoiceId);
    if (result.customer !== stripeId)
      throw new NotFoundException('Invoice not found');
    return result;
  }

  private list<T>(result: Stripe.Response<Stripe.ApiList<T>>) {
    return result.data;
  }

  /** Get the Stripe customer ID from a group or throw an error */
  private async stripeId(groupId: number): Promise<string> {
    const group = await this.prisma.groups.findOne({
      where: { id: groupId },
      select: { attributes: true },
    });
    if (!group) throw new NotFoundException('Group not found');
    const attributes = group.attributes as { stripeCustomerId?: string };
    if (!attributes?.stripeCustomerId)
      throw new BadRequestException('Billing account is not set up');
    return attributes.stripeCustomerId;
  }
}
