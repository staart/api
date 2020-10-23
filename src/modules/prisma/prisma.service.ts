import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, users } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  expose<T>(item: T): Expose<T> {
    if (!item) return null;
    delete ((item as any) as users).password;
    delete ((item as any) as users).twoFactorSecret;
    return item;
  }
}
