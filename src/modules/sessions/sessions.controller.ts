import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { sessions } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Scopes } from '../auth/scope.decorator';
import { ScopesGuard } from '../auth/scope.guard';
import { SessionsService } from './sessions.service';

@Controller('users/:userId/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @Scopes('user{userId}:read', 'session:read')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<sessions>[]> {
    return this.sessionsService.getSessions(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user{userId}:read', 'session{id}:read')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<sessions>> {
    return this.sessionsService.getSession(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user{userId}:delete', 'session{id}:delete')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<sessions>> {
    return this.sessionsService.deleteSession(userId, Number(id));
  }
}
