import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, sessions, users } from '@prisma/client';
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

  /** Delete sensitive keys from an object */
  expose<T>(item: T): Expose<T> {
    if (!item) return null;
    delete ((item as any) as users).password;
    delete ((item as any) as users).twoFactorSecret;
    delete ((item as any) as sessions).token;
    return item;
  }
}
