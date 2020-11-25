import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Email } from '@prisma/client';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { Scopes } from '../auth/scope.decorator';
import { CreateEmailDto } from './emails.dto';
import { EmailsService } from './emails.service';

@Controller('users/:userId/emails')
export class EmailController {
  constructor(private emailsService: EmailsService) {}

  @Post()
  @Scopes('user-{userId}:write-email-*')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateEmailDto,
  ): Promise<Expose<Email>> {
    return this.emailsService.createEmail(userId, data);
  }

  @Get()
  @Scopes('user-{userId}:read-email-*')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<Email>[]> {
    return this.emailsService.getEmails(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user-{userId}:read-email-{id}')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Email>> {
    return this.emailsService.getEmail(userId, Number(id));
  }

  @Delete(':id')
  @Scopes('user-{userId}:delete-email-{id}')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<Email>> {
    return this.emailsService.deleteEmail(userId, Number(id));
  }
}
