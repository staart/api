import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  usersUpdateInput,
  users,
  usersCreateInput,
  usersWhereUniqueInput,
  usersWhereInput,
  usersOrderByInput,
} from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { AuthService } from '../auth/auth.service';
import { compare } from 'bcrypt';
import { PasswordUpdateInput } from './users.interface';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auth: AuthService) {}

  async getUser(id: number): Promise<Expose<users>> {
    const user = await this.prisma.users.findOne({
      where: { id },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return this.prisma.expose<users>(user);
  }

  async getUsers(params: {
    skip?: number;
    take?: number;
    cursor?: usersWhereUniqueInput;
    where?: usersWhereInput;
    orderBy?: usersOrderByInput;
  }): Promise<Expose<users>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const users = await this.prisma.users.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return users.map((user) => this.prisma.expose<users>(user));
  }

  async createUser(data: usersCreateInput): Promise<users> {
    return this.prisma.users.create({
      data,
    });
  }

  async updateUser(
    id: number,
    data: Omit<usersUpdateInput, 'password'> & PasswordUpdateInput,
  ): Promise<Expose<users>> {
    const transformed: usersUpdateInput & PasswordUpdateInput = data;
    if (data.newPassword) {
      if (!data.currentPassword)
        throw new BadRequestException('Current password is required');
      const previousPassword = (
        await this.prisma.users.findOne({
          where: { id },
          select: { password: true },
        })
      )?.password;
      if (previousPassword)
        if (!(await compare(data.currentPassword, previousPassword)))
          throw new BadRequestException('Current password is incorrect');
      transformed.password = await this.auth.hashAndValidatePassword(
        data.newPassword,
        !!data.ignorePwnedPassword,
      );
    }
    delete transformed.currentPassword;
    delete transformed.newPassword;
    delete transformed.ignorePwnedPassword;
    const updateData: usersUpdateInput = transformed;
    const user = await this.prisma.users.update({
      data: updateData,
      where: { id },
    });
    return this.prisma.expose<users>(user);
  }

  async deleteUser(id: number): Promise<Expose<users>> {
    const user = await this.prisma.users.delete({
      where: { id },
    });
    return this.prisma.expose<users>(user);
  }
}
