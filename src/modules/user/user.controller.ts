import { Controller, Get } from '@nestjs/common';
import { users } from '@prisma/client';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';
import { UsersService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll(): Promise<OmitSecrets<users>[]> {
    return this.usersService.users({});
  }

  // @Get('post/:id')
  // async getPostById(@Param('id') id: string): Promise<PostModel> {
  //   return this.postService.post({ id: Number(id) });
  // }
}
