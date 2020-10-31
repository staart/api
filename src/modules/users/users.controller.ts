import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { users } from '@prisma/client';
import { Expose } from '../../../src/modules/prisma/prisma.interface';
import { CursorPipe } from '../../../src/pipes/cursor.pipe';
import { OptionalIntPipe } from '../../../src/pipes/optional-int.pipe';
import { OrderByPipe } from '../../../src/pipes/order-by.pipe';
import { WherePipe } from '../../../src/pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import { UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Scopes('user:read')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<users>[]> {
    return this.usersService.getUsers({ skip, take, orderBy, cursor, where });
  }

  @Get(':id')
  @Scopes('user-{id}:read-info')
  async get(@Param('id', ParseIntPipe) id: number): Promise<Expose<users>> {
    return this.usersService.getUser(Number(id));
  }

  @Patch(':id')
  @Scopes('user-{id}:write-info')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ): Promise<Expose<users>> {
    return this.usersService.updateUser(Number(id), data);
  }

  @Delete(':id')
  @Scopes('user-{id}:delete')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Expose<users>> {
    return this.usersService.deleteUser(Number(id));
  }
}
