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
  Req,
} from '@nestjs/common';
import { ApiKey } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { UserRequest } from '../auth/auth.interface';
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

  /** Create an API key for a user */
  @Post()
  @Scopes('user-{userId}:write-api-key-*')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateApiKeyDto,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.createApiKeyForUser(userId, data);
  }

  /** Get API keys for a user */
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

  /** Get API key scopes for a user */
  @Get('scopes')
  @Scopes('user-{userId}:write-api-key-*')
  async scopes(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Record<string, string>> {
    return this.apiKeysService.getApiKeyScopesForUser(userId);
  }

  /** Get an API key */
  @Get(':id')
  @Scopes('user-{userId}:read-api-key-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.getApiKeyForUser(userId, id);
  }

  /** Update an API key */
  @Patch(':id')
  @Scopes('user-{userId}:write-api-key-{id}')
  async update(
    @Body() data: UpdateApiKeyDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForUser(userId, id, data);
  }

  /** Replace an API key */
  @Put(':id')
  @Scopes('user-{userId}:write-api-key-{id}')
  async replace(
    @Body() data: ReplaceApiKeyDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.updateApiKeyForUser(userId, id, data);
  }

  /** Delete an API key */
  @Delete(':id')
  @Scopes('user-{userId}:delete-api-key-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<ApiKey>> {
    return this.apiKeysService.deleteApiKeyForUser(userId, id);
  }

  /** Get logs for an API key */
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
