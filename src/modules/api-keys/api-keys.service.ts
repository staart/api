import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  apiKeys,
  apiKeysCreateInput,
  apiKeysOrderByInput,
  apiKeysUpdateInput,
  apiKeysWhereInput,
  apiKeysWhereUniqueInput,
  InputJsonValue,
  JsonValue,
} from '@prisma/client';
import QuickLRU from 'quick-lru';
import {
  API_KEY_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { TokensService } from '../../providers/tokens/tokens.service';

@Injectable()
export class ApiKeysService {
  private lru = new QuickLRU<string, apiKeys>({
    maxSize: this.configService.get<number>('caching.apiKeyLruSize') ?? 100,
  });

  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async createApiKeyForGroup(
    groupId: number,
    data: Omit<Omit<apiKeysCreateInput, 'apiKey'>, 'group'>,
  ): Promise<apiKeys> {
    const apiKey = this.tokensService.generateUuid();
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    return this.prisma.apiKeys.create({
      data: { ...data, apiKey, group: { connect: { id: groupId } } },
    });
  }
  async createApiKeyForUser(
    userId: number,
    data: Omit<Omit<apiKeysCreateInput, 'apiKey'>, 'user'>,
  ): Promise<apiKeys> {
    const apiKey = this.tokensService.generateUuid();
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    return this.prisma.apiKeys.create({
      data: { ...data, apiKey, user: { connect: { id: userId } } },
    });
  }

  async getApiKeysForGroup(
    groupId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: apiKeysWhereUniqueInput;
      where?: apiKeysWhereInput;
      orderBy?: apiKeysOrderByInput;
    },
  ): Promise<Expose<apiKeys>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const apiKeys = await this.prisma.apiKeys.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return apiKeys.map((group) => this.prisma.expose<apiKeys>(group));
  }
  async getApiKeysForUser(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: apiKeysWhereUniqueInput;
      where?: apiKeysWhereInput;
      orderBy?: apiKeysOrderByInput;
    },
  ): Promise<Expose<apiKeys>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const apiKeys = await this.prisma.apiKeys.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return apiKeys.map((user) => this.prisma.expose<apiKeys>(user));
  }

  async getApiKeyForGroup(
    groupId: number,
    id: number,
  ): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (apiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<apiKeys>(apiKey);
  }
  async getApiKeyForUser(userId: number, id: number): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (apiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async getApiKeyFromKey(key: string): Promise<Expose<apiKeys>> {
    if (this.lru.has(key)) return this.lru.get(key);
    const apiKey = await this.prisma.apiKeys.findFirst({
      where: { apiKey: key },
    });
    if (!apiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    this.lru.set(key, apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async updateApiKeyForGroup(
    groupId: number,
    id: number,
    data: apiKeysUpdateInput,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    const apiKey = await this.prisma.apiKeys.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }
  async updateApiKeyForUser(
    userId: number,
    id: number,
    data: apiKeysUpdateInput,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    const apiKey = await this.prisma.apiKeys.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async replaceApiKeyForGroup(
    groupId: number,
    id: number,
    data: apiKeysCreateInput,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForGroup(groupId, data.scopes);
    const apiKey = await this.prisma.apiKeys.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }
  async replaceApiKeyForUser(
    userId: number,
    id: number,
    data: apiKeysCreateInput,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    data.scopes = this.cleanScopesForUser(userId, data.scopes);
    const apiKey = await this.prisma.apiKeys.update({
      where: { id },
      data,
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async deleteApiKeyForGroup(
    groupId: number,
    id: number,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const apiKey = await this.prisma.apiKeys.delete({
      where: { id },
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }
  async deleteApiKeyForUser(
    userId: number,
    id: number,
  ): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey) throw new NotFoundException(API_KEY_NOT_FOUND);
    if (testApiKey.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const apiKey = await this.prisma.apiKeys.delete({
      where: { id },
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
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
    const scopes: Record<string, string> = {};
    scopes[`read-info`] = 'Read group details';
    scopes[`write-info`] = 'Update group details';
    scopes[`delete`] = 'Delete group';

    scopes[`write-membership-*`] = 'Invite and update members';
    scopes[`read-membership-*`] = 'Read members';
    for await (const membership of await this.prisma.memberships.findMany({
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
    for await (const apiKey of await this.prisma.apiKeys.findMany({
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
    for await (const webhook of await this.prisma.webhooks.findMany({
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
    for await (const invoice of await this.stripeService.getInvoices(
      groupId,
      {},
    )) {
      scopes[`read-invoice-${invoice.id}`] = `Read invoice: ${invoice.number}`;
    }

    scopes[`write-source-*`] = 'Write payment methods';
    scopes[`read-source-*`] = 'Read payment methods';
    for await (const source of await this.stripeService.getSources(
      groupId,
      {},
    )) {
      scopes[`read-source-${source.id}`] = `Read payment method: ${source.id}`;
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
    for await (const membership of await this.prisma.memberships.findMany({
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
    for await (const email of await this.prisma.emails.findMany({
      where: { user: { id: userId } },
      select: { id: true, email: true },
    })) {
      scopes[`read-email-${email.id}`] = `Read email: ${email.email}`;
      scopes[`delete-email-${email.id}`] = `Delete email: ${email.email}`;
    }

    scopes[`read-session-*`] = 'Read sessions';
    for await (const session of await this.prisma.sessions.findMany({
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
    for await (const subnet of await this.prisma.approvedSubnets.findMany({
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
    for await (const apiKey of await this.prisma.apiKeys.findMany({
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
