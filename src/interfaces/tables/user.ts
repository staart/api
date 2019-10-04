import { UserRole, NotificationEmails, Genders, Tokens } from "../enum";
import { IdRow, Row } from "../general";
import { GeoLocation } from "../../helpers/location";

export interface User extends IdRow {
  name: string;
  username?: string;
  nickname?: string;
  primaryEmail?: string;
  password?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  countryCode?: string;
  timezone?: string;
  notificationEmails?: NotificationEmails;
  preferredLanguage?: string;
  prefersReducedMotion?: boolean;
  prefersColorSchemeDark?: boolean;
  gender?: Genders;
  role?: UserRole;
  profilePicture?: string;
  checkLocationOnLogin?: boolean;

  // email is only used for JWT
  email?: string;
}

export interface ApprovedLocation {
  id?: string;
  userId?: string;
  subnet?: string;
  createdAt?: Date;
}

export interface BackupCode extends Row {
  code: number;
  userId: string;
  used?: boolean;
}

export interface AccessToken extends IdRow {
  name?: string;
  description?: string;
  jwtAccessToken?: string;
  scopes?: string;
  userId: string;
  expiresAt?: Date;
}
export interface AccessTokenResponse {
  id: string;
  userId: string;
  scopes: string;
  jti: string;
  sub: Tokens;
  exp: number;
}

export interface Session extends IdRow {
  userId: string;
  jwtToken: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
}

export interface Identity extends IdRow {
  userId: string;
  type: string;
  identityId: string;
}
