import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  ApprovedSubnet,
  Email,
  PrismaClient,
  Session,
  User,
} from '@prisma/client';
import { Expose } from './prisma.interface';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Delete sensitive keys from an object */
  expose<T>(item: T): Expose<T> {
    if (!item) return {} as T;
    delete ((item as any) as Partial<User>).password;
    delete ((item as any) as Partial<User>).twoFactorSecret;
    delete ((item as any) as Partial<Session>).token;
    delete ((item as any) as Partial<Email>).emailSafe;
    delete ((item as any) as Partial<ApprovedSubnet>).subnet;
    return item;
  }
}
