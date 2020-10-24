import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { emails } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Scopes } from '../auth/scope.decorator';
import { ScopesGuard } from '../auth/scope.guard';
import { CreateEmailDto } from './emails.dto';
import { EmailsService } from './emails.service';

@Controller('users/:userId/emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private emailsService: EmailsService) {}

  @Post()
  @Scopes('user{userId}:write', 'email:write')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateEmailDto,
  ): Promise<Expose<emails>> {
    return this.emailsService.createEmail(userId, data);
  }

  @Get()
  @Scopes('user{userId}:read', 'email:read')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<emails>[]> {
    return this.emailsService.getEmails(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user{userId}:read', 'email{id}:read')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<emails>> {
    return this.emailsService.getEmail(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user{userId}:delete', 'email{id}:delete')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<emails>> {
    return this.emailsService.deleteEmail(userId, Number(id));
  }
}
