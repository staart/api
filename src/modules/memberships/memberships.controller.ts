import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { memberships } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Scopes } from '../auth/scope.decorator';
import { ScopesGuard } from '../auth/scope.guard';
import { MembershipsService } from './memberships.service';

@Controller('users/:userId/memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private membershipsService: MembershipsService) {}

  @Get()
  @Scopes('user{userId}:read', 'membership:read')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<memberships>[]> {
    return this.membershipsService.getMemberships(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user{userId}:read', 'membership{id}:read')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<memberships>> {
    return this.membershipsService.getMembership(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user{userId}:delete', 'membership{id}:delete')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<memberships>> {
    return this.membershipsService.deleteMembership(userId, Number(id));
  }
}
