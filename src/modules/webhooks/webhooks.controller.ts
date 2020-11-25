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
import { Webhook } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import {
  CreateWebhookDto,
  ReplaceWebhookDto,
  UpdateWebhookDto,
} from './webhooks.dto';
import { WebhooksService } from './webhooks.service';

@Controller('groups/:groupId/webhooks')
export class WebhookController {
  constructor(private webhooksService: WebhooksService) {}

  @Post()
  @AuditLog('create-webhook')
  @Scopes('group-{groupId}:write-webhook-*')
  async create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateWebhookDto,
  ): Promise<Expose<Webhook>> {
    return this.webhooksService.createWebhook(groupId, data);
  }

  @Get()
  @Scopes('group-{groupId}:read-webhook-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Webhook>[]> {
    return this.webhooksService.getWebhooks(groupId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get('scopes')
  @Scopes('group-{groupId}:write-webhook-*')
  async scopes(): Promise<Record<string, string>> {
    return this.webhooksService.getWebhookScopes();
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-webhook-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Webhook>> {
    return this.webhooksService.getWebhook(groupId, Number(id));
  }

  @Patch(':id')
  @AuditLog('update-webhook')
  @Scopes('group-{groupId}:write-webhook-{id}')
  async update(
    @Body() data: UpdateWebhookDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Webhook>> {
    return this.webhooksService.updateWebhook(groupId, Number(id), data);
  }

  @Put(':id')
  @AuditLog('update-webhook')
  @Scopes('group-{groupId}:write-webhook-{id}')
  async replace(
    @Body() data: ReplaceWebhookDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Webhook>> {
    return this.webhooksService.updateWebhook(groupId, Number(id), data);
  }

  @Delete(':id')
  @AuditLog('delete-webhook')
  @Scopes('group-{groupId}:delete-webhook-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Webhook>> {
    return this.webhooksService.deleteWebhook(groupId, Number(id));
  }
}
