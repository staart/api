import { Injectable } from '@nestjs/common';
import { users, usersCreateInput } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: usersCreateInput): Promise<users> {
    return this.prisma.users.create({
      data,
    });
  }
}
