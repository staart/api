import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { ApiKey } from '@prisma/client';
import { ElasticSearchService } from '../../providers/elasticsearch/elasticsearch.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { StripeService } from '../stripe/stripe.service';
export declare class ApiKeysService {
    private prisma;
    private tokensService;
    private stripeService;
    private configService;
    private elasticSearchService;
    private lru;
    constructor(prisma: PrismaService, tokensService: TokensService, stripeService: StripeService, configService: ConfigService, elasticSearchService: ElasticSearchService);
    createApiKeyForGroup(groupId: number, data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'group'>): Promise<ApiKey>;
    createApiKeyForUser(userId: number, data: Omit<Omit<Prisma.ApiKeyCreateInput, 'apiKey'>, 'user'>): Promise<ApiKey>;
    getApiKeysForGroup(groupId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ApiKeyWhereUniqueInput;
        where?: Prisma.ApiKeyWhereInput;
        orderBy?: Prisma.ApiKeyOrderByInput;
    }): Promise<Expose<ApiKey>[]>;
    getApiKeysForUser(userId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ApiKeyWhereUniqueInput;
        where?: Prisma.ApiKeyWhereInput;
        orderBy?: Prisma.ApiKeyOrderByInput;
    }): Promise<Expose<ApiKey>[]>;
    getApiKeyForGroup(groupId: number, id: number): Promise<Expose<ApiKey>>;
    getApiKeyForUser(userId: number, id: number): Promise<Expose<ApiKey>>;
    getApiKeyFromKey(key: string): Promise<Expose<ApiKey>>;
    updateApiKeyForGroup(groupId: number, id: number, data: Prisma.ApiKeyUpdateInput): Promise<Expose<ApiKey>>;
    updateApiKeyForUser(userId: number, id: number, data: Prisma.ApiKeyUpdateInput): Promise<Expose<ApiKey>>;
    replaceApiKeyForGroup(groupId: number, id: number, data: Prisma.ApiKeyCreateInput): Promise<Expose<ApiKey>>;
    replaceApiKeyForUser(userId: number, id: number, data: Prisma.ApiKeyCreateInput): Promise<Expose<ApiKey>>;
    deleteApiKeyForGroup(groupId: number, id: number): Promise<Expose<ApiKey>>;
    deleteApiKeyForUser(userId: number, id: number): Promise<Expose<ApiKey>>;
    getApiKeyLogsForGroup(groupId: number, id: number, params: {
        take?: number;
        cursor?: {
            id?: number;
        };
        where?: {
            after?: string;
        };
    }): Promise<Record<string, any>[]>;
    getApiKeyLogsForUser(userId: number, id: number, params: {
        take?: number;
        cursor?: {
            id?: number;
        };
        where?: {
            after?: string;
        };
    }): Promise<Record<string, any>[]>;
    removeUnauthorizedScopesForUser(userId: number): Promise<void>;
    private getApiLogsFromKey;
    private cleanScopesForGroup;
    private cleanScopesForUser;
    getApiKeyScopesForGroup(groupId: number): Promise<Record<string, string>>;
    getApiKeyScopesForUser(userId: number): Promise<Record<string, string>>;
}
