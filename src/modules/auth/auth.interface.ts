import { Request as NestRequest } from '@nestjs/common';
import { MfaMethod } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

export interface AccessTokenClaims {
  sub: string;
  scopes: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TotpTokenResponse {
  totpToken: string;
  type: MfaMethod;
  multiFactorRequired: true;
}

export interface AccessTokenParsed {
  id: number;
  scopes: string[];
}

export interface MfaTokenPayload {
  id: number;
  type: MfaMethod;
}

type CombinedRequest = ExpressRequest & typeof NestRequest;
export interface UserRequest extends CombinedRequest {
  user: AccessTokenParsed;
}

export interface ValidatedUser {
  id: number;
  name: string;
  twoFactorMethod: MfaMethod;
  twoFactorSecret: string | null;
  checkLocationOnLogin: boolean;
  prefersEmailAddress: string;
}
