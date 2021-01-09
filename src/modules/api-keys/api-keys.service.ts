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
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { groupOwnerScopes, userScopes } from '../../helpers/scopes';
import { ElasticSearchService } from '../../providers/elasticsearch/elasticsearch.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';

@Injectable()
export class ApiKeysService {
  private lru = new QuickLRU<string, ApiKey>({
    maxSize: this.configService.get<number>('caching.apiKeyLruSize') ?? 100,
  });

  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private configService: ConfigService,
    private elasticSearchService: ElasticSearchService,
  ) {}

  async createApiKeyForGroup(
    groupId: number,
    data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'group'>,
  ): Promise<ApiKey> {
    const apiKey = await this.tokensService.generateRandomString();
    data.scopes = await this.cleanScopesForGroup(groupId, data.scopes);
    return this.prisma.apiKey.create({
      data: { ...data, apiKey, group: { connect: { id: groupId } } },
    });
  }
  async createApiKeyForUser(
    userId: number,
    data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'user'>,
  ): Promise<ApiKey> {
    const apiKey = await this.tokensService.generateRandomString();
    data.scopes = await this.cleanScopesForUser(userId, data.scopes);
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
    try {
      const apiKey = await this.prisma.apiKey.findMany({
        skip,
        take,
        cursor,
        where: { ...where, group: { id: groupId } },
        orderBy,
      });
      return apiKey.map((group) => this.prisma.expose<ApiKey>(group));
    } catch (error) {
      return [];
    }
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
    try {
      const apiKey = await this.prisma.apiKey.findMany({
        skip,
        take,
        cursor,
        where: { ...where, user: { id: userId } },
        orderBy,
      });
      return apiKey.map((user) => this.prisma.expose<ApiKey>(user));
    } catch (error) {
      return [];
    }
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
    data.scopes = await this.cleanScopesForGroup(groupId, data.scopes);
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
    data.scopes = await this.cleanScopesForUser(userId, data.scopes);
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
    data.scopes = await this.cleanScopesForGroup(groupId, data.scopes);
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
    data.scopes = await this.cleanScopesForUser(userId, data.scopes);
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

  private async cleanScopesForGroup(
    groupId: number,
    scopes: InputJsonValue,
  ): Promise<JsonValue[]> {
    if (!Array.isArray(scopes)) return [];
    return (scopes as string[]).filter((i) =>
      Object.keys(
        Object.keys(groupOwnerScopes).map((i) =>
          i.replace('{groupId}', groupId.toString()),
        ),
      ).includes(i),
    );
  }
  private async cleanScopesForUser(
    userId: number,
    scopes: InputJsonValue,
    allowedScopes?: Record<string, string>,
  ): Promise<JsonValue[]> {
    if (!Array.isArray(scopes)) return [];
    if (!allowedScopes)
      allowedScopes = await this.getApiKeyScopesForUser(userId);
    return (scopes as string[]).filter((i) =>
      Object.keys(allowedScopes).includes(i),
    );
  }

  /**
   * Clean all API keys for a user, i.e., make sure they don't have
   * any scopes they're not allowed to have
   */
  async cleanAllApiKeysForUser(userId: number): Promise<void> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { user: { id: userId } },
      select: { id: true, scopes: true },
    });
    if (!apiKeys.length) return;
    const allowedScopes = await this.getApiKeyScopesForUser(userId);
    for await (const apiKey of apiKeys)
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          scopes: await this.cleanScopesForUser(
            userId,
            apiKey.scopes,
            allowedScopes,
          ),
        },
      });
  }

  getApiKeyScopesForGroup(groupId: number): Record<string, string> {
    const scopes: Record<string, string> = {};
    Object.keys(groupOwnerScopes).forEach(
      (key) =>
        (scopes[key.replace('{groupId}', groupId.toString())] =
          groupOwnerScopes[key]),
    );
    return scopes;
  }

  async getApiKeyScopesForUser(
    userId: number,
  ): Promise<Record<string, string>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!userId) throw new NotFoundException(USER_NOT_FOUND);
    const scopes: Record<string, string> = {};
    if (user.role === 'SUDO') {
      scopes['*'] = 'Do everything (USE WITH CAUTION)';
      scopes['user-*:*'] = 'CRUD users';
      scopes['group-*:*'] = 'CRUD groups';
    }
    Object.keys(userScopes).forEach(
      (key) =>
        (scopes[key.replace('{userId}', userId.toString())] = userScopes[key]),
    );
    return scopes;
  }
}
