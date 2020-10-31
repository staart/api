import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { sessions } from '@prisma/client';
import { Expose } from '../../../src/modules/prisma/prisma.interface';
import { CursorPipe } from '../../../src/pipes/cursor.pipe';
import { OptionalIntPipe } from '../../../src/pipes/optional-int.pipe';
import { OrderByPipe } from '../../../src/pipes/order-by.pipe';
import { WherePipe } from '../../../src/pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import { SessionsService } from './sessions.service';

@Controller('users/:userId/sessions')
export class SessionController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  @Scopes('user-{userId}:read-session')
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
  @Scopes('user-{userId}:read-session-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<sessions>> {
    return this.sessionsService.getSession(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-session-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<sessions>> {
    return this.sessionsService.deleteSession(userId, Number(id));
  }
}
