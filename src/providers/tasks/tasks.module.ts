import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticSearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [ConfigModule, PrismaModule, ElasticSearchModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
