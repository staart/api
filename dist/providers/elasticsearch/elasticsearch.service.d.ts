import { Client } from '@elastic/elasticsearch';
import { Index, Search } from '@elastic/elasticsearch/api/requestParams';
import { TransportRequestOptions } from '@elastic/elasticsearch/lib/Transport';
import { ConfigService } from '@nestjs/config';
export declare class ElasticSearchService {
    private configService;
    private logger;
    private queue;
    private elasticSearchConfig;
    client?: Client;
    constructor(configService: ConfigService);
    index(index: string, record: Record<string, any>, params?: Index): void;
    search(params?: Search<Record<string, any>>, options?: TransportRequestOptions): import("@elastic/elasticsearch/lib/Transport").TransportRequestPromise<import("@elastic/elasticsearch").ApiResponse<Record<string, any>, Record<string, unknown>>>;
    deleteOldRecords: (index: string, days: number) => Promise<import("@elastic/elasticsearch").ApiResponse<Record<string, any>, Record<string, unknown>>>;
    private indexRecord;
}
