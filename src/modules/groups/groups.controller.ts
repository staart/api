import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { groups } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { Scopes } from '../auth/scope.decorator';
import { ReplaceGroupDto, UpdateGroupDto } from './groups.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  @Scopes('group:read')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<groups>[]> {
    return this.groupsService.getGroups({
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('group-{id}:read-info')
  async get(@Param('id', ParseIntPipe) id: number): Promise<Expose<groups>> {
    return this.groupsService.getGroup(Number(id));
  }

  @Patch(':id')
  @Scopes('group-{id}:write-info')
  async update(
    @Body() data: UpdateGroupDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<groups>> {
    return this.groupsService.updateGroup(Number(id), data);
  }

  @Put(':id')
  @Scopes('group-{id}:write-info')
  async replace(
    @Body() data: ReplaceGroupDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<groups>> {
    return this.groupsService.updateGroup(Number(id), data);
  }

  @Delete(':id')
  @Scopes('group-{id}:delete')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Expose<groups>> {
    return this.groupsService.deleteGroup(Number(id));
  }
}
