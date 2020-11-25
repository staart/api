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

@Controller('users/:userId/api-keys')
export class ApiKeyUserController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @AuditLog('create-api-key')
  @Scopes('user-{userId}:write-api-key-*')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateApiKeyDto,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.createApiKeyForUser(userId, data);
  }

  @Get()
  @Scopes('user-{userId}:read-api-key-*')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<ApiKey>[]> {
    return this.apiKeysService.getApiKeysForUser(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get('scopes')
  @Scopes('user-{userId}:write-api-key-*')
  async scopes(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Record<string, string>> {
    return this.apiKeysService.getApiKeyScopesForUser(userId);
  }

  @Get(':id')
  @Scopes('user-{userId}:read-api-key-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.getApiKeyForUser(userId, Number(id));
  }

  @Patch(':id')
  @AuditLog('update-api-key')
  @Scopes('user-{userId}:write-api-key-{id}')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForUser(userId, Number(id), data);
  }

  @Put(':id')
  @AuditLog('update-api-key')
  @Scopes('user-{userId}:write-api-key-{id}')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForUser(userId, Number(id), data);
  }

  @Delete(':id')
  @AuditLog('delete-api-key')
  @Scopes('user-{userId}:delete-api-key-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.deleteApiKeyForUser(userId, Number(id));
  }

  @Get(':id/logs')
  @Scopes('user-{userId}:read-api-key-logs-*')
  async getLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
  ): Promise<Record<string, any>[]> {
    return this.apiKeysService.getApiKeyLogsForUser(userId, id, {
      take,
      cursor,
      where,
    });
  }
}
