import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { memberships } from '@prisma/client';
import { Expose } from '../../../src/modules/prisma/prisma.interface';
import { CursorPipe } from '../../../src/pipes/cursor.pipe';
import { OptionalIntPipe } from '../../../src/pipes/optional-int.pipe';
import { OrderByPipe } from '../../../src/pipes/order-by.pipe';
import { WherePipe } from '../../../src/pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import { CreateGroupDto } from '../groups/groups.dto';
import { MembershipsService } from './memberships.service';

@Controller('users/:userId/memberships')
export class UserMembershipController {
  constructor(private membershipsService: MembershipsService) {}

  @Post()
  @Scopes('user-{userId}:write-membership')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateGroupDto,
  ): Promise<Expose<memberships>> {
    return this.membershipsService.createUserMembership(userId, data);
  }

  @Get()
  @Scopes('user-{userId}:read-membership')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<memberships>[]> {
    return this.membershipsService.getMemberships({
      skip,
      take,
      orderBy,
      cursor,
      where: { ...where, user: { id: userId } },
    });
  }

  @Get(':id')
  @Scopes('user-{userId}:read-membership-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<memberships>> {
    return this.membershipsService.getUserMembership(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-membership-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<memberships>> {
    return this.membershipsService.deleteUserMembership(userId, Number(id));
  }
}
