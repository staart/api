import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  usersUpdateInput,
  users,
  usersCreateInput,
  usersWhereUniqueInput,
  usersWhereInput,
  usersOrderByInput,
} from '@prisma/client';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: usersWhereUniqueInput,
  ): Promise<OmitSecrets<users> | null> {
    const user = await this.prisma.users.findOne({
      where: userWhereUniqueInput,
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<users>(user);
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: usersWhereUniqueInput;
    where?: usersWhereInput;
    orderBy?: usersOrderByInput;
  }): Promise<OmitSecrets<users>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const users = await this.prisma.users.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return users.map(user => this.prisma.expose<users>(user));
  }

  async createUser(data: usersCreateInput): Promise<users> {
    return this.prisma.users.create({
      data,
    });
  }

  async updateUser(params: {
    where: usersWhereUniqueInput;
    data: usersUpdateInput;
  }): Promise<OmitSecrets<users>> {
    const { where, data } = params;
    const user = await this.prisma.users.update({
      data,
      where,
    });
    return this.prisma.expose<users>(user);
  }

  async deleteUser(where: usersWhereUniqueInput): Promise<OmitSecrets<users>> {
    const user = await this.prisma.users.delete({
      where,
    });
    return this.prisma.expose<users>(user);
  }
}
