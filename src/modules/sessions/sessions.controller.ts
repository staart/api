import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Session } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { Scopes } from '../auth/scope.decorator';
import { SessionsService } from './sessions.service';

@Controller('users/:userId/sessions')
export class SessionController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @Scopes('user-{userId}:read-session-*')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Session>[]> {
    return this.sessionsService.getSessions(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user-{userId}:read-session-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Session>> {
    return this.sessionsService.getSession(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-session-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Session>> {
    return this.sessionsService.deleteSession(userId, Number(id));
  }
}
