import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { Files } from '../../helpers/interfaces';
import { CursorPipe } from '../../pipes/cursor.pipe';
import { OptionalIntPipe } from '../../pipes/optional-int.pipe';
import { OrderByPipe } from '../../pipes/order-by.pipe';
import { WherePipe } from '../../pipes/where.pipe';
import { Expose } from '../../providers/prisma/prisma.interface';
import { UserRequest } from '../auth/auth.interface';
import { RateLimit } from '../auth/rate-limit.decorator';
import { Scopes } from '../auth/scope.decorator';
import { UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  /** Get users */
  @Get()
  @Scopes('user-*:read-info')
  async getAll(
    @Query('skip', OptionalIntPipe) skip?: number,
    @Query('take', OptionalIntPipe) take?: number,
    @Query('cursor', CursorPipe) cursor?: Record<string, number | string>,
    @Query('where', WherePipe) where?: Record<string, number | string>,
    @Query('orderBy', OrderByPipe) orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<Expose<User>[]> {
    return this.usersService.getUsers({ skip, take, orderBy, cursor, where });
  }

  /** Get a user */
  @Get(':userId')
  @Scopes('user-{userId}:read-info')
  async get(@Param('userId', ParseIntPipe) id: number): Promise<Expose<User>> {
    return this.usersService.getUser(id);
  }

  /** Update a user */
  @Patch(':userId')
  @Scopes('user-{userId}:write-info')
  async update(
    @Req() request: UserRequest,
    @Param('userId', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ): Promise<Expose<User>> {
    return this.usersService.updateUser(id, data, request.user.role);
  }

  /** Delete a user */
  @Delete(':userId')
  @Scopes('user-{userId}:deactivate')
  async remove(
    @Param('userId', ParseIntPipe) id: number,
    @Req() request: UserRequest,
  ): Promise<Expose<User>> {
    return this.usersService.deactivateUser(
      id,
      request.user.type === 'user' && request.user?.id,
    );
  }

  /** Upload profile picture */
  @Post(':userId/profile-picture')
  @Scopes('user-{userId}:write-info')
  @UseInterceptors(FilesInterceptor('files'))
  async profilePicture(
    @Param('userId', ParseIntPipe) id: number,
    @UploadedFiles() files: Files,
  ) {
    if (files.length && files[0])
      return this.usersService.uploadProfilePicture(id, files[0]);
    else throw new BadRequestException();
  }

  /** Send a link to merge two users */
  @Post(':userId/merge-request')
  @Scopes('user-{userId}:merge')
  @RateLimit(10)
  async mergeRequest(
    @Param('userId', ParseIntPipe) id: number,
    @Body('email') email: string,
  ): Promise<{ queued: true }> {
    return this.usersService.requestMerge(id, email);
  }
}
