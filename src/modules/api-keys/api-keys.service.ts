import {
  HttpException,
  HttpStatus,
  Injectable,
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
} from '@prisma/client';
import QuickLRU from 'quick-lru';
import { Expose } from '../../modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { TokensService } from '../tokens/tokens.service';

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
    return this.prisma.apiKeys.create({
      data: { ...data, apiKey, group: { connect: { id: groupId } } },
    });
  }
  async createApiKeyForUser(
    userId: number,
    data: Omit<Omit<apiKeysCreateInput, 'apiKey'>, 'user'>,
  ): Promise<apiKeys> {
    const apiKey = this.tokensService.generateUuid();
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
    if (!apiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (apiKey.groupId !== groupId) throw new UnauthorizedException();
    return this.prisma.expose<apiKeys>(apiKey);
  }
  async getApiKeyForUser(userId: number, id: number): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!apiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (apiKey.userId !== userId) throw new UnauthorizedException();
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async getApiKeyFromKey(key: string): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findFirst({
      where: { apiKey: key },
    });
    if (!apiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (this.lru.has(key)) return this.lru.get(key);
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.groupId !== groupId) throw new UnauthorizedException();
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.userId !== userId) throw new UnauthorizedException();
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.groupId !== groupId) throw new UnauthorizedException();
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.userId !== userId) throw new UnauthorizedException();
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.groupId !== groupId) throw new UnauthorizedException();
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
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.userId !== userId) throw new UnauthorizedException();
    const apiKey = await this.prisma.apiKeys.delete({
      where: { id },
    });
    this.lru.delete(testApiKey.apiKey);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async getApiKeyScopesForGroup(
    groupId: number,
  ): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {};
    scopes[`group-${groupId}:read-info`] = 'Read group details';
    scopes[`group-${groupId}:write-info`] = 'Update group details';
    scopes[`group-${groupId}:delete`] = 'Delete group';

    scopes[`group-${groupId}:write-membership-*`] = 'Invite and update members';
    scopes[`group-${groupId}:read-membership-*`] = 'Read members';
    for await (const membership of await this.prisma.memberships.findMany({
      where: { group: { id: groupId } },
      select: { id: true, user: true },
    })) {
      scopes[
        `group-${groupId}:read-membership-${membership.id}`
      ] = `Read membership: ${membership.user.name}`;
      scopes[
        `group-${groupId}:write-membership-${membership.id}`
      ] = `Update membership: ${membership.user.name}`;
      scopes[
        `group-${groupId}:delete-membership-${membership.id}`
      ] = `Delete membership: ${membership.user.name}`;
    }

    scopes[`group-${groupId}:write-api-key-*`] = 'Create and update API keys';
    scopes[`group-${groupId}:read-api-key-*`] = 'Read API keys';
    for await (const apiKey of await this.prisma.apiKeys.findMany({
      where: { group: { id: groupId } },
      select: { id: true, name: true, apiKey: true },
    })) {
      scopes[`group-${groupId}:read-api-key-${apiKey.id}`] = `Read API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[`group-${groupId}:write-api-key-${apiKey.id}`] = `Write API key: ${
        apiKey.name ?? apiKey.apiKey
      }`;
      scopes[
        `group-${groupId}:delete-api-key-${apiKey.id}`
      ] = `Delete API key: ${apiKey.name ?? apiKey.apiKey}`;
    }

    scopes[`group-${groupId}:write-webhook-*`] = 'Create and update webhooks';
    scopes[`group-${groupId}:read-webhook-*`] = 'Read webhooks';
    for await (const webhook of await this.prisma.webhooks.findMany({
      where: { group: { id: groupId } },
      select: { id: true, url: true },
    })) {
      scopes[
        `group-${groupId}:read-webhook-${webhook.id}`
      ] = `Read webhook: ${webhook.url}`;
      scopes[
        `group-${groupId}:write-webhook-${webhook.id}`
      ] = `Write webhook: ${webhook.url}`;
      scopes[
        `group-${groupId}:delete-webhook-${webhook.id}`
      ] = `Delete webhook: ${webhook.url}`;
    }

    scopes[`group-${groupId}:write-billing`] = 'Write billing details';
    scopes[`group-${groupId}:read-billing`] = 'Read billing details';
    scopes[`group-${groupId}:delete-billing`] = 'Delete billing details';

    scopes[`group-${groupId}:read-invoice-*`] = 'Read invoices';
    for await (const invoice of await this.stripeService.getInvoices(
      groupId,
      {},
    )) {
      scopes[
        `group-${groupId}:read-invoice-${invoice.id}`
      ] = `Read invoice: ${invoice.number}`;
    }

    scopes[`group-${groupId}:write-source-*`] = 'Write payment methods';
    scopes[`group-${groupId}:read-source-*`] = 'Read payment methods';
    for await (const source of await this.stripeService.getSources(
      groupId,
      {},
    )) {
      scopes[
        `group-${groupId}:read-source-${source.id}`
      ] = `Read payment method: ${source.id}`;
      scopes[
        `group-${groupId}:delete-source-${source.id}`
      ] = `Delete payment method: ${source.id}`;
    }

    scopes[`group-${groupId}:read-audit-log-*`] = 'Read audit logs';
    return scopes;
  }

  async getApiKeyScopesForUser(
    userId: number,
  ): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {};
    scopes[`user-${userId}:read-info`] = 'Read user details';
    scopes[`user-${userId}:write-info`] = 'Update user details';
    scopes[`user-${userId}:delete`] = 'Delete user';

    scopes[`user-${userId}:write-membership-*`] = 'Create new groups';
    scopes[`user-${userId}:read-membership-*`] = 'Read group memberships';
    for await (const membership of await this.prisma.memberships.findMany({
      where: { user: { id: userId } },
      select: { id: true, group: true },
    })) {
      scopes[
        `user-${userId}:read-membership-${membership.id}`
      ] = `Read membership: ${membership.group.name}`;
      scopes[
        `user-${userId}:write-membership-${membership.id}`
      ] = `Update membership: ${membership.group.name}`;
      scopes[
        `user-${userId}:delete-membership-${membership.id}`
      ] = `Delete membership: ${membership.group.name}`;
    }

    scopes[`user-${userId}:write-email-*`] = 'Create and update emails';
    scopes[`user-${userId}:read-email-*`] = 'Read emails';
    for await (const email of await this.prisma.emails.findMany({
      where: { user: { id: userId } },
      select: { id: true, email: true },
    })) {
      scopes[
        `user-${userId}:read-email-${email.id}`
      ] = `Read email: ${email.email}`;
      scopes[
        `user-${userId}:delete-email-${email.id}`
      ] = `Delete email: ${email.email}`;
    }

    scopes[`user-${userId}:read-session-*`] = 'Read sessions';
    for await (const session of await this.prisma.sessions.findMany({
      where: { user: { id: userId } },
      select: { id: true, browser: true },
    })) {
      scopes[`user-${userId}:read-session-${session.id}`] = `Read session: ${
        session.browser ?? session.id
      }`;
      scopes[
        `user-${userId}:delete-session-${session.id}`
      ] = `Delete session: ${session.browser ?? session.id}`;
    }

    scopes[`user-${userId}:read-approved-subnet-*`] = 'Read approvedSubnets';
    for await (const subnet of await this.prisma.approvedSubnets.findMany({
      where: { user: { id: userId } },
      select: { id: true, subnet: true },
    })) {
      scopes[
        `user-${userId}:read-approved-subnet-${subnet.id}`
      ] = `Read subnet: ${subnet.subnet}`;
      scopes[
        `user-${userId}:delete-approved-subnet-${subnet.id}`
      ] = `Delete subnet: ${subnet.subnet}`;
    }

    scopes[`user-${userId}:delete-mfa-*`] =
      'Disable multi-factor authentication';
    scopes[`user-${userId}:write-mfa-regenerate`] =
      'Regenerate MFA backup codes';
    scopes[`user-${userId}:write-mfa-totp`] = 'Enable TOTP-based MFA';
    scopes[`user-${userId}:write-mfa-sms`] = 'Enable SMS-based MFA';
    scopes[`user-${userId}:write-mfa-email`] = 'Enable email-based MFA';

    return scopes;
  }
}
