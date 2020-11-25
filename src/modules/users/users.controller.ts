import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { RateLimit } from '../auth/rate-limit.decorator';
import { Scopes } from '../auth/scope.decorator';
import { UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Scopes('user-*:read-info')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<User>[]> {
    return this.usersService.getUsers({ skip, take, orderBy, cursor, where });
  }

  @Get(':userId')
  @Scopes('user-{userId}:read-info')
  async get(@Param('userId', ParseIntPipe) id: number): Promise<Expose<User>> {
    return this.usersService.getUser(Number(id));
  }

  @Patch(':userId')
  @Scopes('user-{userId}:write-info')
  async update(
    @Param('userId', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ): Promise<Expose<User>> {
    return this.usersService.updateUser(Number(id), data);
  }

  @Delete(':userId')
  @Scopes('user-{userId}:deactivate')
  async remove(
    @Param('userId', ParseIntPipe) id: number,
  ): Promise<Expose<User>> {
    return this.usersService.deactivateUser(Number(id));
  }

  @Post(':userId/merge-request')
  @Scopes('user-{userId}:merge')
  @RateLimit(10)
  async mergeRequest(
    @Param('userId', ParseIntPipe) id: number,
    @Body('email') email: string,
  ): Promise<{ queued: true }> {
    return this.usersService.requestMerge(Number(id), email);
  }
}
