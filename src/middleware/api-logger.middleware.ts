import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { Configuration } from '../config/configuration.interface';
import { ElasticSearchService } from '../providers/elasticsearch/elasticsearch.service';

@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService,
    private elasticSearchService: ElasticSearchService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const config = this.configService.get<Configuration['tracking']>(
      'tracking',
    );
    let date = new Date();
    res.on('finish', () => {
      const obj = {
        date,
        method: req.method,
        protocol: req.protocol,
        path: req.path,
        authorization: req.headers.authorization ?? req.headers['x-api-key'],
        duration: new Date().getTime() - date.getTime(),
        status: res.statusCode,
      };
      if (config.mode === 'all')
        this.elasticSearchService.index(config.index, obj);
      else if (config.mode === 'api-key' && req.headers['x-api-key'])
        this.elasticSearchService.index(config.index, obj);
    });
    next();
  }
}
