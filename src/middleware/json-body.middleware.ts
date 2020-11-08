import { Injectable, NestMiddleware } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    bodyParser.json()(req, res, next);
  }
}
