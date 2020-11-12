import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticSearchService } from './elasticsearch.service';

@Module({
  imports: [ConfigModule],
  providers: [ElasticSearchService],
  exports: [ElasticSearchService],
})
export class ElasticSearchModule {}
