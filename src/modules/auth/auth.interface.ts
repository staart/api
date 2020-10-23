import { Request } from '@nestjs/common';

export interface AccessTokenClaims {
  sub: string;
  scopes: string[];
}

export interface AccessTokenParsed {
  id: number;
  scopes: string[];
}

export interface UserRequest extends Request {
  user: AccessTokenParsed;
}
