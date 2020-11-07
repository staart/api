import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  webhooks,
  webhooksCreateInput,
  webhooksOrderByInput,
  webhooksUpdateInput,
  webhooksWhereInput,
  webhooksWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createWebhook(
    groupId: number,
    data: Omit<Omit<webhooksCreateInput, 'webhook'>, 'group'>,
  ): Promise<webhooks> {
    return this.prisma.webhooks.create({
      data: { ...data, group: { connect: { id: groupId } } },
    });
  }

  async getWebhooks(
    groupId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: webhooksWhereUniqueInput;
      where?: webhooksWhereInput;
      orderBy?: webhooksOrderByInput;
    },
  ): Promise<Expose<webhooks>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const webhooks = await this.prisma.webhooks.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return webhooks.map((group) => this.prisma.expose<webhooks>(group));
  }

  async getWebhook(groupId: number, id: number): Promise<Expose<webhooks>> {
    const webhook = await this.prisma.webhooks.findOne({
      where: { id },
    });
    if (!webhook)
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    if (webhook.groupId !== groupId) throw new UnauthorizedException();
    return this.prisma.expose<webhooks>(webhook);
  }

  async updateWebhook(
    groupId: number,
    id: number,
    data: webhooksUpdateInput,
  ): Promise<Expose<webhooks>> {
    const testWebhook = await this.prisma.webhooks.findOne({
      where: { id },
    });
    if (!testWebhook)
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    if (testWebhook.groupId !== groupId) throw new UnauthorizedException();
    const webhook = await this.prisma.webhooks.update({
      where: { id },
      data,
    });
    return this.prisma.expose<webhooks>(webhook);
  }

  async replaceWebhook(
    groupId: number,
    id: number,
    data: webhooksCreateInput,
  ): Promise<Expose<webhooks>> {
    const testWebhook = await this.prisma.webhooks.findOne({
      where: { id },
    });
    if (!testWebhook)
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    if (testWebhook.groupId !== groupId) throw new UnauthorizedException();
    const webhook = await this.prisma.webhooks.update({
      where: { id },
      data,
    });
    return this.prisma.expose<webhooks>(webhook);
  }

  async deleteWebhook(groupId: number, id: number): Promise<Expose<webhooks>> {
    const testWebhook = await this.prisma.webhooks.findOne({
      where: { id },
    });
    if (!testWebhook)
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    if (testWebhook.groupId !== groupId) throw new UnauthorizedException();
    const webhook = await this.prisma.webhooks.delete({
      where: { id },
    });
    return this.prisma.expose<webhooks>(webhook);
  }

  async getWebhookScopes(groupId: number): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {};
    return scopes;
  }
}
