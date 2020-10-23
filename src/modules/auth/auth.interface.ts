import { Request as ExpressRequest } from 'express';
import { Request as NestRequest } from '@nestjs/common';

export interface AccessTokenClaims {
  sub: string;
  scopes: string[];
}

export interface AccessTokenParsed {
  id: number;
  scopes: string[];
}

type CombinedRequest = ExpressRequest & typeof NestRequest;
export interface UserRequest extends CombinedRequest {
  user: AccessTokenParsed;
}
