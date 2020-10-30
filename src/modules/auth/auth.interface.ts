import { Request as ExpressRequest } from 'express';
import { Request as NestRequest } from '@nestjs/common';

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
  type: MfaTypes;
  multiFactorRequired: true;
}

export interface AccessTokenParsed {
  id: number;
  scopes: string[];
}

export type MfaTypes = 'TOTP' | 'EMAIL';

export interface MfaTokenPayload {
  id: number;
  type: MfaTypes;
}

type CombinedRequest = ExpressRequest & typeof NestRequest;
export interface UserRequest extends CombinedRequest {
  user: AccessTokenParsed;
}

export interface ValidatedUser {
  id: number;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  checkLocationOnLogin: boolean;
  prefersEmailAddress: string;
}
