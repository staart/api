import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {
  apiKeys,
  apiKeysCreateInput,
  apiKeysOrderByInput,
  apiKeysUpdateInput,
  apiKeysWhereInput,
  apiKeysWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../../../src/modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(
    groupId: number,
    data: Omit<Omit<apiKeysCreateInput, 'apiKey'>, 'group'>,
  ): Promise<apiKeys> {
    const apiKey = randomStringGenerator();
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
}
