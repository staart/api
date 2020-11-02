import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { approvedSubnets } from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import { ApprovedSubnetsService } from './approved-subnets.service';

@Controller('users/:userId/approved-subnets')
export class ApprovedSubnetController {
  constructor(private approvedSubnetsService: ApprovedSubnetsService) {}

  @Get()
  @Scopes('user-{userId}:read-approved-subnet-*')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<approvedSubnets>[]> {
    return this.approvedSubnetsService.getApprovedSubnets(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user-{userId}:read-approved-subnet-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<approvedSubnets>> {
    return this.approvedSubnetsService.getApprovedSubnet(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-approved-subnet-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<approvedSubnets>> {
    return this.approvedSubnetsService.deleteApprovedSubnet(userId, Number(id));
  }
}
