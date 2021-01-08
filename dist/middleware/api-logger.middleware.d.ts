import { NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { ElasticSearchService } from '../providers/elasticsearch/elasticsearch.service';
export declare class ApiLoggerMiddleware implements NestMiddleware {
    private configService;
    private elasticSearchService;
    constructor(configService: ConfigService, elasticSearchService: ElasticSearchService);
    use(req: Request, res: Response, next: NextFunction): void;
}
