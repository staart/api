import { IdRow } from "../general";

export interface Organization extends IdRow {
  name?: string;
  username?: string;
  forceTwoFactor?: boolean;
  ipRestrictions?: string;
  stripeCustomerId?: string;
}

export interface ApiKey extends IdRow {
  name?: string;
  description?: string;
  jwtApiKey?: string;
  scopes?: string;
  organizationId: number;
  ipRestrictions?: string;
  referrerRestrictions?: string;
  expiresAt?: Date;
}

export interface Domain extends IdRow {
  organizationId: number;
  domain: string;
  isVerified: boolean;
}
