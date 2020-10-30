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
  stripe = new Stripe(this.configService.get<string>('payments.stripeApiKey'), {
    apiVersion: null,
  });

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

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

  /** Get the Stripe customer ID from a group or throw an error */
  private async stripeId(groupId: number): Promise<string> {
    const team = await this.prisma.groups.findOne({
      where: { id: groupId },
      select: { attributes: true },
    });
    const attributes = team.attributes as { stripeCustomerId?: string };
    if (!attributes?.stripeCustomerId)
      throw new BadRequestException('Billing account is not set up');
    return attributes.stripeCustomerId;
  }
}
