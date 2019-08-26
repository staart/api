import { IdRow } from "../general";
import { Webhooks } from "../enum";

export interface Organization extends IdRow {
  name?: string;
  username?: string;
  forceTwoFactor?: boolean;
  autoJoinDomain?: boolean;
  onlyAllowDomain?: boolean;
  ipRestrictions?: string;
  stripeCustomerId?: string;
  profilePicture?: string;
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
  verificationCode?: string;
  isVerified: boolean;
}

export interface Webhook extends IdRow {
  organizationId: number;
  url: string;
  event: Webhooks;
  contentType: "application/json" | "application/x-www-form-urlencoded";
  secret?: string;
  isActive: boolean;
}
