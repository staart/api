import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  approvedSubnets,
  emails,
  PrismaClient,
  sessions,
  users,
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
    delete ((item as any) as Partial<users>).password;
    delete ((item as any) as Partial<users>).twoFactorSecret;
    delete ((item as any) as Partial<sessions>).token;
    delete ((item as any) as Partial<emails>).emailSafe;
    delete ((item as any) as Partial<approvedSubnets>).subnet;
    return item;
  }
}
