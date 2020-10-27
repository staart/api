import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
