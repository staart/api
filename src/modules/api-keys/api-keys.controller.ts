import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { apiKeys } from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import {
  CreateApiKeyDto,
  ReplaceApiKeyDto,
  UpdateApiKeyDto,
} from './api-keys.dto';
import { ApiKeysService } from './api-keys.service';

@Controller('groups/:groupId/api-keys')
export class ApiKeyController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @Scopes('group-{groupId}:write-api-key-*')
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateApiKeyDto,
  ): Promise<Expose<apiKeys>> {
    return this.apiKeysService.createApiKey(groupId, data);
  }

  @Get()
  @Scopes('group-{groupId}:read-api-key-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<apiKeys>[]> {
    return this.apiKeysService.getApiKeys(groupId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-api-key-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<apiKeys>> {
    return this.apiKeysService.getApiKey(groupId, Number(id));
  }

  @Patch(':id')
  @Scopes('group-{groupId}:write-api-key-{id}')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<apiKeys>> {
    return this.apiKeysService.updateApiKey(groupId, Number(id), data);
  }

  @Put(':id')
  @Scopes('group-{groupId}:write-api-key-{id}')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<apiKeys>> {
    return this.apiKeysService.updateApiKey(groupId, Number(id), data);
  }

  @Delete(':id')
  @Scopes('group-{groupId}:delete-api-key-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<apiKeys>> {
    return this.apiKeysService.deleteApiKey(groupId, Number(id));
  }
}
