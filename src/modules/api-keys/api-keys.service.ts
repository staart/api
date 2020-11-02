import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  apiKeys,
  apiKeysCreateInput,
  apiKeysOrderByInput,
  apiKeysUpdateInput,
  apiKeysWhereInput,
  apiKeysWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class ApiKeysService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private stripeService: StripeService,
  ) {}

  async createApiKey(
    groupId: number,
    data: Omit<Omit<apiKeysCreateInput, 'apiKey'>, 'group'>,
  ): Promise<apiKeys> {
    const apiKey = this.tokensService.generateUuid();
    return this.prisma.apiKeys.create({
      data: { ...data, apiKey, group: { connect: { id: groupId } } },
    });
  }

  async getApiKeys(
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

  async getApiKey(groupId: number, id: number): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!apiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (apiKey.groupId !== groupId) throw new UnauthorizedException();
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async getApiKeyFromKey(key: string): Promise<Expose<apiKeys>> {
    const apiKey = await this.prisma.apiKeys.findFirst({
      where: { apiKey: key },
    });
    if (!apiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async updateApiKey(
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
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async replaceApiKey(
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
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async deleteApiKey(groupId: number, id: number): Promise<Expose<apiKeys>> {
    const testApiKey = await this.prisma.apiKeys.findOne({
      where: { id },
    });
    if (!testApiKey)
      throw new HttpException('ApiKey not found', HttpStatus.NOT_FOUND);
    if (testApiKey.groupId !== groupId) throw new UnauthorizedException();
    const apiKey = await this.prisma.apiKeys.delete({
      where: { id },
    });
    return this.prisma.expose<apiKeys>(apiKey);
  }

  async getApiKeyScopes(groupId: number): Promise<Record<string, string>> {
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

    return scopes;
  }
}
