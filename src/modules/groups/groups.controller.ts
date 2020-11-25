import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { Group } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import { ReplaceGroupDto, UpdateGroupDto } from './groups.dto';
import { GroupsService } from './groups.service';
import { SelectIncludePipe } from '../../pipes/select-include.pipe';

@Controller('groups')
export class GroupController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  @Scopes('group-*:read-info')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Group>[]> {
    return this.groupsService.getGroups({
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':groupId')
  @Scopes('group-{groupId}:read-info')
  async get(
    @Param('groupId', ParseIntPipe) id: number,
    @Query('select', SelectIncludePipe) select?: Record<string, boolean>,
    @Query('include', SelectIncludePipe) include?: Record<string, boolean>,
  ): Promise<Expose<Group>> {
    return this.groupsService.getGroup(Number(id), { select, include });
  }

  @Patch(':groupId')
  @AuditLog('update-info')
  @Scopes('group-{groupId}:write-info')
  async update(
    @Body() data: UpdateGroupDto,
    @Param('groupId', ParseIntPipe) id: number,
  ): Promise<Expose<Group>> {
    return this.groupsService.updateGroup(Number(id), data);
  }

  @Put(':groupId')
  @AuditLog('update-info')
  @Scopes('group-{groupId}:write-info')
  async replace(
    @Body() data: ReplaceGroupDto,
    @Param('groupId', ParseIntPipe) id: number,
  ): Promise<Expose<Group>> {
    return this.groupsService.updateGroup(Number(id), data);
  }

  @Delete(':groupId')
  @AuditLog('delete')
  @Scopes('group-{groupId}:delete')
  async remove(
    @Param('groupId', ParseIntPipe) id: number,
  ): Promise<Expose<Group>> {
    return this.groupsService.deleteGroup(Number(id));
  }

  @Get(':groupId/subgroups')
  @Scopes('group-*:read-info')
  async getSubgroups(
    @Param('groupId', ParseIntPipe) id: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Group>[]> {
    return this.groupsService.getSubgroups(id, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }
}
