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
import { ApiKey } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import {
  CreateApiKeyDto,
  ReplaceApiKeyDto,
  UpdateApiKeyDto,
} from './api-keys.dto';
import { ApiKeysService } from './api-keys.service';

@Controller('groups/:groupId/api-keys')
export class ApiKeyGroupController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @AuditLog('create-api-key')
  @Scopes('group-{groupId}:write-api-key-*')
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateApiKeyDto,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.createApiKeyForGroup(groupId, data);
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
  ): Promise<Expose<ApiKey>[]> {
    return this.apiKeysService.getApiKeysForGroup(groupId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get('scopes')
  @Scopes('group-{groupId}:write-api-key-*')
  async scopes(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<Record<string, string>> {
    return this.apiKeysService.getApiKeyScopesForGroup(groupId);
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-api-key-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.getApiKeyForGroup(groupId, Number(id));
  }

  @Patch(':id')
  @AuditLog('update-api-key')
  @Scopes('group-{groupId}:write-api-key-{id}')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForGroup(groupId, Number(id), data);
  }

  @Put(':id')
  @AuditLog('update-api-key')
  @Scopes('group-{groupId}:write-api-key-{id}')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForGroup(groupId, Number(id), data);
  }

  @Delete(':id')
  @AuditLog('delete-api-key')
  @Scopes('group-{groupId}:delete-api-key-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.deleteApiKeyForGroup(groupId, Number(id));
  }

  @Get(':id/logs')
  @Scopes('group-{groupId}:read-api-key-logs-*')
  async getLogs(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
  ): Promise<Record<string, any>[]> {
    console.log('where', where);
    return this.apiKeysService.getApiKeyLogsForGroup(groupId, id, {
      take,
      cursor,
      where,
    });
  }
}
