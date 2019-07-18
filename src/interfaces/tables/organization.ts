export interface Organization {
  id?: number;
  name?: string;
  username?: string;
  forceTwoFactor?: boolean;
  ipRestrictions?: string;
  invitationDomain?: string;
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiKey {
  id?: number;
  jwtApiKey?: string;
  apiRestrictions?: string;
  organizationId: number;
  ipRestrictions?: string;
  referrerRestrictions?: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
