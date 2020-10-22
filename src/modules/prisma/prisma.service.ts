import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  expose<T>(item: T): OmitSecrets<T> {
    if (!item) return null;
    return item;
  }
}
