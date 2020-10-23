import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { users } from '@prisma/client';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { UserRequest } from '../auth/auth.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './user.dto';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<OmitSecrets<users>[]> {
    return this.usersService.users({ skip, take, orderBy, cursor, where });
  }

  @Get(':id')
  async get(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OmitSecrets<users>> {
    console.log(req.user);
    return this.usersService.user({ id: Number(id) });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ): Promise<OmitSecrets<users>> {
    return this.usersService.updateUser({ where: { id: Number(id) }, data });
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OmitSecrets<users>> {
    return this.usersService.deleteUser({ id: Number(id) });
  }
}
