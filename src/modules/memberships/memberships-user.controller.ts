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
import { Membership } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
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
  ): Promise<Expose<Membership>> {
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
  ): Promise<Expose<Membership>[]> {
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
  ): Promise<Expose<Membership>> {
    return this.membershipsService.getUserMembership(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-membership-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Membership>> {
    return this.membershipsService.deleteUserMembership(userId, Number(id));
  }
}
