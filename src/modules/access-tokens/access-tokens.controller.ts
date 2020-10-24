import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { accessTokens } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { CursorPipe } from 'src/pipes/cursor.pipe';
import { OptionalIntPipe } from 'src/pipes/optional-int.pipe';
import { OrderByPipe } from 'src/pipes/order-by.pipe';
import { WherePipe } from 'src/pipes/where.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Scopes } from '../auth/scope.decorator';
import { ScopesGuard } from '../auth/scope.guard';
import {
  CreateAccessTokenDto,
  UpdateAccessTokenDto,
  ReplaceAccessTokenDto,
} from './access-tokens.dto';
import { AccessTokensService } from './access-tokens.service';

@Controller('users/:userId/access-tokens')
@UseGuards(JwtAuthGuard)
export class AccessTokenController {
  constructor(private accessTokensService: AccessTokensService) {}

  @Post()
  @Scopes('user{userId}:write', 'access-token:write')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateAccessTokenDto,
  ): Promise<Expose<accessTokens>> {
    return this.accessTokensService.createAccessToken(userId, data);
  }

  @Get()
  @Scopes('user{userId}:read', 'access-token:read')
  async getAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<accessTokens>[]> {
    return this.accessTokensService.getAccessTokens(userId, {
      skip,
      take,
      orderBy,
      cursor,
      where,
    });
  }

  @Get(':id')
  @Scopes('user{userId}:read', 'access-token{id}:read')
  async get(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<accessTokens>> {
    return this.accessTokensService.getAccessToken(userId, Number(id));
  }

  @Patch(':id')
  @Scopes('user{userId}:write', 'access-token{id}:write')
  async update(
    @Body() data: UpdateAccessTokenDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<accessTokens>> {
    return this.accessTokensService.updateAccessToken(userId, Number(id), data);
  }

  @Put(':id')
  @Scopes('user{userId}:write', 'access-token{id}:write')
  async replace(
    @Body() data: ReplaceAccessTokenDto,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<accessTokens>> {
    return this.accessTokensService.updateAccessToken(userId, Number(id), data);
  }

  @Delete(':id')
  @Scopes('user{userId}:delete', 'access-token{id}:delete')
  async remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Expose<accessTokens>> {
    return this.accessTokensService.deleteAccessToken(userId, Number(id));
  }
}
