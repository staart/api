import { Client } from '@elastic/elasticsearch';
import { Index } from '@elastic/elasticsearch/api/requestParams';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class ElasticSearchService {
  private logger = new Logger(ElasticSearchService.name);
  private queue = new PQueue({ concurrency: 1 });
  private client: Client;

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['elasticSearch']>(
      'elasticSearch',
    );
    if (config.aws?.accessKeyId)
      this.client = new Client({
        node: config.node,
      });
    else
      this.client = new Client({
        node: config.node,
      });
  }

  index(index: string, record: Record<string, any>, params?: Index) {
    this.queue
      .add(() =>
        pRetry(() => this.indexRecord(index, record, params), {
          retries: this.configService.get<number>('elasticSearch.retries') ?? 3,
          onFailedAttempt: (error) => {
            this.logger.error(
              `Indexing record failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        }),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async indexRecord(
    index: string,
    record: Record<string, any>,
    params?: Index,
  ) {
    return this.client.index({ index, body: record, ...params });
  }
}
