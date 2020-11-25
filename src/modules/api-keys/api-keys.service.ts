import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InputJsonValue, JsonValue, Prisma } from '@prisma/client';
import { ApiKey } from '@prisma/client';
import QuickLRU from 'quick-lru';
import {
  API_KEY_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { ElasticSearchService } from '../../providers/elasticsearch/elasticsearch.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class ApiKeysService {
  private lru = new QuickLRU<string, ApiKey>({
    maxSize: this.configService.get<number>('caching.apiKeyLruSize') ?? 100,
  });

  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private stripeService: StripeService,
    private configService: ConfigService,
    private elasticSearchService: ElasticSearchService,
  ) {}

  async createApiKeyForGroup(
    groupId: number,
    data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'group'>,
  ): Promise<ApiKey> {
    const apiKey = this.tokensService.generateUuid();
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    return this.prisma.apiKey.create({
      data: { ...data, apiKey, group: { connect: { id: groupId } } },
    });
  }
  async createApiKeyForUser(
    userId: number,
    data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'user'>,
  ): Promise<ApiKey> {
    const apiKey = this.tokensService.generateUuid();
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    return this.prisma.apiKey.create({
      data: { ...data, apiKey, user: { connect: { id: userId } } },
    });
  }

  async getApiKeysForGroup(
    groupId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ApiKeyWhereUniqueInput;
      where?: Prisma.ApiKeyWhereInput;
      orderBy?: Prisma.ApiKeyOrderByInput;
    },
  ): Promise<Expose<ApiKey>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const ApiKey = await this.prisma.apiKey.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return ApiKey.map((group) => this.prisma.expose<ApiKey>(group));
  }
  async getApiKeysForUser(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ApiKeyWhereUniqueInput;
      where?: Prisma.ApiKeyWhereInput;
      orderBy?: Prisma.ApiKeyOrderByInput;
    },
  ): Promise<Expose<ApiKey>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const ApiKey = await this.prisma.apiKey.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return ApiKey.map((user) => this.prisma.expose<ApiKey>(user));
  }

  async getApiKeyForGroup(
    groupId: number,
    id: number,
  ): Promise<Expose<ApiKey>> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (apiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<ApiKey>(apiKey);
  }
  async getApiKeyForUser(userId: number, id: number): Promise<Expose<ApiKey>> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (apiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<ApiKey>(apiKey);
  }

  async getApiKeyFromKey(key: string): Promise<Expose<ApiKey>> {
    if (this.lru.has(key)) return this.lru.get(key);
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { apiKey: key },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    this.lru.set(key, apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }

  async updateApiKeyForGroup(
    groupId: number,
    id: number,
    data: Prisma.ApiKeyUpdateInput,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }
  async updateApiKeyForUser(
    userId: number,
    id: number,
    data: Prisma.ApiKeyUpdateInput,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }

  async replaceApiKeyForGroup(
    groupId: number,
    id: number,
    data: Prisma.ApiKeyCreateInput,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }
  async replaceApiKeyForUser(
    userId: number,
    id: number,
    data: Prisma.ApiKeyCreateInput,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }

  async deleteApiKeyForGroup(
    groupId: number,
    id: number,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const apiKey = await this.prisma.apiKey.delete({
      where: { id },
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }
  async deleteApiKeyForUser(
    userId: number,
    id: number,
  ): Promise<Expose<ApiKey>> {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const apiKey = await this.prisma.apiKey.delete({
      where: { id },
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<ApiKey>(apiKey);
  }

  async getApiKeyLogsForGroup(
    groupId: number,
    id: number,
    params: {
      take?: number;
      cursor?: { id?: number };
      where?: { after?: string };
    },
  ) {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.getApiLogsFromKey(testApiKey.apiKey, params);
  }
  async getApiKeyLogsForUser(
    userId: number,
    id: number,
    params: {
      take?: number;
      cursor?: { id?: number };
      where?: { after?: string };
    },
  ) {
    const testApiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.getApiLogsFromKey(testApiKey.apiKey, params);
  }

  /**
   * Remove any unauthorized scopes in an API key for a user
   * This should run when a user's permissions have changed, for example
   * if they are removed from a group; this will remove any API scopes
   * they don't have access to anymore from that API key
   */
  async removeUnauthorizedScopesForUser(userId: number): Promise<void> {
    const userApiKeys = await this.prisma.apiKey.findMany({
      where: { user: { id: userId } },
    });
    if (!userApiKeys.length) return;
    const scopesAllowed = await this.getApiKeyScopesForUser(userId);
    for await (const apiKey of userApiKeys) {
      const currentScopes = (apiKey.scopes ?? []) as string[];
      const newScopes = currentScopes.filter((i) =>
        Object.keys(scopesAllowed).includes(i),
      );
      if (currentScopes.length !== newScopes.length)
        this.prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { scopes: newScopes },
        });
    }
  }

  private async getApiLogsFromKey(
    apiKey: string,
    params: {
      take?: number;
      cursor?: { id?: number };
      where?: { after?: string };
    },
  ): Promise<Record<string, any>[]> {
    const now = new Date();
    now.setDate(
      now.getDate() -
        this.configService.get<number>('tracking.deleteOldLogsDays'),
    );
    const result = await this.elasticSearchService.search({
      index: this.configService.get<string>('tracking.index'),
      from: params.cursor?.id,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  authorization: apiKey,
                },
              },
              {
                range: {
                  date: {
                    gte: params.where?.after
                      ? new Date(
                          new Date().getTime() -
                            new Date(params.where?.after).getTime(),
                        )
                      : now,
                  },
                },
              },
            ],
          },
        },
        sort: [
          {
            date: { order: 'desc' },
          },
        ],
        size: params.take ?? 100,
      },
    });
    try {
      return result.body.hits.hits.map(
        (item: {
          _index: string;
          _type: '_doc';
          _id: string;
          _score: any;
          _source: Record<string, any>;
        }) => ({ ...item._source, id: item._id }),
      );
    } catch (error) {}
    return [];
  }

  private cleanScopesForGroup(
    groupId: number,
    scopes: InputJsonValue,
  ): JsonValue[] {
    if (!Array.isArray(scopes)) return [];
    return scopes
      .map((scope) => {
        if (typeof scope === 'string') {
          if (!scope.startsWith(`group-${groupId}:`))
            scope = `group-${groupId}:${scope}`;
          return scope;
        }
      })
      .filter((scope) => !!scope);
  }
  private cleanScopesForUser(
    userId: number,
    scopes: InputJsonValue,
  ): JsonValue[] {
    if (!Array.isArray(scopes)) return [];
    return scopes
      .map((scope) => {
        if (typeof scope === 'string') {
          if (!scope.startsWith(`user-${userId}:`))
            scope = `user-${userId}:${scope}`;
          return scope;
        }
      })
      .filter((scope) => !!scope);
  }

  async getApiKeyScopesForGroup(
    groupId: number,
  ): Promise<Record<string, string>> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { attributes: true },
    });
    const attributes = group.attributes as { stripeCustomerId?: string };

    const scopes: Record<string, string> = {};
    scopes[`read-info`] = 'Read group details';
    scopes[`write-info`] = 'Update group details';
    scopes[`delete`] = 'Delete group';

    scopes[`write-membership-*`] = 'Invite and update members';
    scopes[`read-membership-*`] = 'Read members';
    for await (const membership of await this.prisma.membership.findMany({
      where: { group: { id: groupId } },
      select: { id: true, user: true },
    })) {
      scopes[
        `read-membership-${membership.id}`
      ] = `Read membership: ${membership.user.name}`;
      scopes[
        `write-membership-${membership.id}`
      ] = `Update membership: ${membership.user.name}`;
      scopes[
        `delete-membership-${membership.id}`
      ] = `Delete membership: ${membership.user.name}`;
    }

    scopes[`write-api-key-*`] = 'Create and update API keys';
    scopes[`read-api-key-*`] = 'Read API keys';
    for await (const apiKey of await this.prisma.apiKey.findMany({
      where: { group: { id: groupId } },
      select: { id: true, name: true, apiKey: true },
    })) {
      scopes[`read-api-key-${apiKey.id}`] = `Read API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[`write-api-key-${apiKey.id}`] = `Write API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[`delete-api-key-${apiKey.id}`] = `Delete API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
    }

    scopes[`write-webhook-*`] = 'Create and update webhooks';
    scopes[`read-webhook-*`] = 'Read webhooks';
    for await (const webhook of await this.prisma.webhook.findMany({
      where: { group: { id: groupId } },
      select: { id: true, url: true },
    })) {
      scopes[`read-webhook-${webhook.id}`] = `Read webhook: ${webhook.url}`;
      scopes[`write-webhook-${webhook.id}`] = `Write webhook: ${webhook.url}`;
      scopes[`delete-webhook-${webhook.id}`] = `Delete webhook: ${webhook.url}`;
    }

    scopes[`write-billing`] = 'Write billing details';
    scopes[`read-billing`] = 'Read billing details';
    scopes[`delete-billing`] = 'Delete billing details';

    scopes[`read-invoice-*`] = 'Read invoices';
    if (attributes?.stripeCustomerId)
      for await (const invoice of await this.stripeService.getInvoices(
        groupId,
        {},
      )) {
        scopes[
          `read-invoice-${invoice.id}`
        ] = `Read invoice: ${invoice.number}`;
      }

    scopes[`write-source-*`] = 'Write payment methods';
    scopes[`read-source-*`] = 'Read payment methods';
    if (attributes?.stripeCustomerId)
      for await (const source of await this.stripeService.getSources(
        groupId,
        {},
      )) {
        scopes[
          `read-source-${source.id}`
        ] = `Read payment method: ${source.id}`;
        scopes[
          `delete-source-${source.id}`
        ] = `Delete payment method: ${source.id}`;
      }

    scopes[`read-audit-log-*`] = 'Read audit logs';
    return scopes;
  }

  async getApiKeyScopesForUser(
    userId: number,
  ): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {};
    scopes[`read-info`] = 'Read user details';
    scopes[`write-info`] = 'Update user details';
    scopes[`deactivate`] = 'Deactivate user';

    scopes[`write-membership-*`] = 'Create new groups';
    scopes[`read-membership-*`] = 'Read group memberships';
    for await (const membership of await this.prisma.membership.findMany({
      where: { user: { id: userId } },
      select: { id: true, group: true },
    })) {
      scopes[
        `read-membership-${membership.id}`
      ] = `Read membership: ${membership.group.name}`;
      scopes[
        `write-membership-${membership.id}`
      ] = `Update membership: ${membership.group.name}`;
      scopes[
        `delete-membership-${membership.id}`
      ] = `Delete membership: ${membership.group.name}`;
    }

    scopes[`write-email-*`] = 'Create and update emails';
    scopes[`read-email-*`] = 'Read emails';
    for await (const email of await this.prisma.email.findMany({
      where: { user: { id: userId } },
      select: { id: true, email: true },
    })) {
      scopes[`read-email-${email.id}`] = `Read email: ${email.email}`;
      scopes[`delete-email-${email.id}`] = `Delete email: ${email.email}`;
    }

    scopes[`read-session-*`] = 'Read sessions';
    for await (const session of await this.prisma.session.findMany({
      where: { user: { id: userId } },
      select: { id: true, browser: true },
    })) {
      scopes[`read-session-${session.id}`] = `Read session: ${
        session.browser ?? session.id
      }`;
      scopes[`delete-session-${session.id}`] = `Delete session: ${
        session.browser ?? session.id
      }`;
    }

    scopes[`read-approved-subnet-*`] = 'Read approvedSubnets';
    for await (const subnet of await this.prisma.approvedSubnet.findMany({
      where: { user: { id: userId } },
      select: { id: true, subnet: true },
    })) {
      scopes[
        `read-approved-subnet-${subnet.id}`
      ] = `Read subnet: ${subnet.subnet}`;
      scopes[
        `delete-approved-subnet-${subnet.id}`
      ] = `Delete subnet: ${subnet.subnet}`;
    }

    scopes[`write-api-key-*`] = 'Create and update API keys';
    scopes[`read-api-key-*`] = 'Read API keys';
    for await (const apiKey of await this.prisma.apiKey.findMany({
      where: { user: { id: userId } },
      select: { id: true, name: true, apiKey: true },
    })) {
      scopes[`read-api-key-${apiKey.id}`] = `Read API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[`write-api-key-${apiKey.id}`] = `Write API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[`delete-api-key-${apiKey.id}`] = `Delete API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
    }

    scopes[`delete-mfa-*`] = 'Disable multi-factor authentication';
    scopes[`write-mfa-regenerate`] = 'Regenerate MFA backup codes';
    scopes[`write-mfa-totp`] = 'Enable TOTP-based MFA';
    scopes[`write-mfa-sms`] = 'Enable SMS-based MFA';
    scopes[`write-mfa-email`] = 'Enable email-based MFA';

    return scopes;
  }
}
