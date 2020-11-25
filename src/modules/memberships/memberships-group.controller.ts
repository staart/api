import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Membership } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { AuditLog } from '../audit-logs/audit-log.decorator';
import { Scopes } from '../auth/scope.decorator';
import {
  CreateGroupMembershipDto,
  UpdateMembershipDto,
} from './memberships.dto';
import { MembershipsService } from './memberships.service';

@Controller('groups/:groupId/memberships')
export class GroupMembershipController {
  constructor(private membershipsService: MembershipsService) {}

  @Post()
  @AuditLog('add-membership')
  @Scopes('group-{groupId}:write-membership-*')
  async create(
    @Ip() ip: string,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() data: CreateGroupMembershipDto,
  ): Promise<Expose<Membership>> {
    return this.membershipsService.createGroupMembership(ip, groupId, data);
  }

  @Get()
  @Scopes('group-{groupId}:read-membership-*')
  async getAll(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Membership>[]> {
    return this.membershipsService.getMemberships({
      skip,
      take,
      orderBy,
      cursor,
      where: { ...where, group: { id: groupId } },
    });
  }

  @Get(':id')
  @Scopes('group-{groupId}:read-membership-{id}')
  async get(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Membership>> {
    return this.membershipsService.getGroupMembership(groupId, Number(id));
  }

  @Patch(':id')
  @AuditLog('update-membership')
  @Scopes('group-{groupId}:write-membership-{id}')
  async update(
    @Body() data: UpdateMembershipDto,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Membership>> {
    return this.membershipsService.updateGroupMembership(
      groupId,
      Number(id),
      data,
    );
  }

  @Delete(':id')
  @AuditLog('delete-membership')
  @Scopes('group-{groupId}:delete-membership-{id}')
  async remove(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Membership>> {
    return this.membershipsService.deleteGroupMembership(groupId, Number(id));
  }
}
