import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { users } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Scopes } from '../auth/scope.decorator';
import { ScopesGuard } from '../auth/scope.guard';
import { UpdateUserDto } from './user.dto';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(ScopesGuard)
  @Scopes('user:read')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<users>[]> {
    return this.usersService.users({ skip, take, orderBy, cursor, where });
  }

  @Get(':id')
  @UseGuards(ScopesGuard)
  @Scopes('user{id}:read')
  async get(@Param('id', ParseIntPipe) id: number): Promise<Expose<users>> {
    return this.usersService.user({ id: Number(id) });
  }

  @Patch(':id')
  @UseGuards(ScopesGuard)
  @Scopes('user{id}:write')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ): Promise<Expose<users>> {
    return this.usersService.updateUser({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  @UseGuards(ScopesGuard)
  @Scopes('user{id}:delete')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Expose<users>> {
    return this.usersService.deleteUser({ id: Number(id) });
  }
}
