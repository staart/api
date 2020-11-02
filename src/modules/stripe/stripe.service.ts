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

  async getSubscriptions(
    groupId: number,
    params: {
      take?: number;
      cursor?: { id: string };
    },
  ): Promise<Stripe.Subscription[]> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.subscriptions.list({
      customer: stripeId,
      limit: params.take,
      starting_after: params.cursor?.id,
    });
    return this.list<Stripe.Subscription>(result);
  }

  async getSubscription(
    groupId: number,
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.subscriptions.retrieve(subscriptionId);
    if (result.customer !== stripeId)
      throw new NotFoundException('Subscription not found');
    return result;
  }

  async getSources(
    groupId: number,
    params: {
      take?: number;
      cursor?: { id: string };
    },
  ): Promise<Stripe.CustomerSource[]> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.customers.listSources(stripeId, {
      limit: params.take,
      starting_after: params.cursor?.id,
    });
    return this.list<Stripe.CustomerSource>(result);
  }

  async getSource(groupId: number, sourceId: string): Promise<Stripe.Source> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.sources.retrieve(sourceId);
    if (result.customer !== stripeId)
      throw new NotFoundException('Source not found');
    return result;
  }

  async deleteSource(groupId: number, sourceId: string): Promise<void> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.sources.retrieve(sourceId);
    if (result.customer !== stripeId)
      throw new NotFoundException('Source not found');
    await this.stripe.customers.deleteSource(stripeId, sourceId);
  }

  async createSession(
    groupId: number,
    mode: Stripe.Checkout.SessionCreateParams.Mode,
    price?: string,
  ): Promise<Stripe.Checkout.Session> {
    const stripeId = await this.stripeId(groupId);
    const data: Stripe.Checkout.SessionCreateParams = {
      customer: stripeId,
      mode,
      payment_method_types: this.configService.get<
        Array<Stripe.Checkout.SessionCreateParams.PaymentMethodType>
      >('payments.paymentMethodTypes') ?? ['card'],
      success_url: `${this.configService.get<string>(
        'frontendUrl',
      )}/groups/${groupId}/subscription`,
      cancel_url: `${this.configService.get<string>(
        'frontendUrl',
      )}/groups/${groupId}/subscription`,
    };
    if (mode === 'subscription') data.line_items = [{ quantity: 1, price }];
    const result = await this.stripe.checkout.sessions.create(data);
    return result;
  }

  async cancelSubscription(
    groupId: number,
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const stripeId = await this.stripeId(groupId);
    const result = await this.stripe.subscriptions.retrieve(subscriptionId);
    if (result.customer !== stripeId)
      throw new NotFoundException('Subscription not found');
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async plans(groupId: number, product?: string): Promise<Stripe.Plan[]> {
    const stripeId = await this.stripeId(groupId);
    const plans = await this.stripe.plans.list({ product });
    return plans.data.filter((plan) => {
      let show = true;
      ['special', 'internal'].forEach((word) => {
        if (plan.nickname.toLowerCase().includes(word)) show = false;
      });
      const tokens = plan.nickname
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/\s\s+/g, ' ')
        .split(' ');
      [stripeId, groupId.toString()].forEach((word) => {
        if (tokens.includes(word)) show = true;
      });
      return show;
    });
  }

  async handleWebhook(signature: string, payload: any) {
    this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.configService.get<string>('payments.stripeEndpointSecret') ?? '',
    );
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
