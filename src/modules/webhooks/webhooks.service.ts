import {
  Injectable,
  Logger,
  NotFoundException,
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
import got from 'got';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import {
  UNAUTHORIZED_RESOURCE,
  WEBHOOK_NOT_FOUND,
} from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private queue = new PQueue({ concurrency: 1 });

  constructor(private prisma: PrismaService) {}

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
    if (!webhook) throw new NotFoundException(WEBHOOK_NOT_FOUND);
    if (webhook.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
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
    if (!testWebhook) throw new NotFoundException(WEBHOOK_NOT_FOUND);
    if (testWebhook.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
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
    if (!testWebhook) throw new NotFoundException(WEBHOOK_NOT_FOUND);
    if (testWebhook.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
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
    if (!testWebhook) throw new NotFoundException(WEBHOOK_NOT_FOUND);
    if (testWebhook.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const webhook = await this.prisma.webhooks.delete({
      where: { id },
    });
    return this.prisma.expose<webhooks>(webhook);
  }

  async getWebhookScopes(): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {
      'create-api-key': 'Create API key',
      'update-api-key': 'Update API key',
      'delete-api-key': 'Delete API key',
      'create-domain': 'Create domain',
      'delete-domain': 'Delete domain',
      'verify-domain-txt': 'Verify domain (TXT)',
      'verify-domain-html': 'Verify domain (HTML)',
      'update-info': 'Update info',
      delete: 'Delete group',
      'add-membership': 'Add membership',
      'update-membership': 'Update membership',
      'delete-membership': 'Delete membership',
      'create-billing': 'Create billing',
      'update-billing': 'Update billing',
      'delete-billing': 'Delete billing',
      'write-source': 'Write source',
      'delete-source': 'Delete source',
      'create-subscription': 'Create subscription',
      'delete-subscription': 'Delete subscription',
      'create-webhook': 'Create webhook',
      'update-webhook': 'Update webhook',
      'delete-webhook': 'Delete webhook',
    };
    return scopes;
  }

  triggerWebhook(groupId: number, event: string) {
    this.prisma.webhooks
      .findMany({
        where: { group: { id: groupId }, isActive: true, event },
      })
      .then((webhooks) => {
        webhooks.forEach((webhook) =>
          this.queue
            .add(() =>
              pRetry(() => this.callWebhook(webhook, event), {
                retries: 3,
                onFailedAttempt: (error) => {
                  this.logger.error(
                    `Triggering webhoook failed, retrying (${error.retriesLeft} attempts left)`,
                    error.name,
                  );
                  if (error.retriesLeft === 0)
                    this.prisma.webhooks
                      .update({
                        where: { id: webhook.id },
                        data: { isActive: false },
                      })
                      .then(() => {})
                      .catch(() => {});
                },
              }),
            )
            .then(() => {})
            .catch(() => {}),
        );
      })
      .catch((error) => this.logger.error('Unable to get webhooks', error));
  }

  private async callWebhook(webhook: webhooks, event: string) {
    if (webhook.contentType === 'application/json')
      await got(webhook.url, { method: 'POST', json: { event } });
    else await got(webhook.url, { method: 'POST', body: event });
    await this.prisma.webhooks.update({
      where: { id: webhook.id },
      data: { lastFiredAt: new Date() },
    });
  }
}
