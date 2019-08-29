import { UserRole, NotificationEmails, Genders, Tokens } from "../enum";
import { IdRow, Row } from "../general";
import { GeoLocation } from "../../helpers/location";

export interface User extends IdRow {
  name: string;
  username?: string;
  nickname?: string;
  primaryEmail?: number;
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

  // email is only used for JWT
  email?: string;
}

export interface ApprovedLocation {
  id?: number;
  userId?: number;
  subnet?: string;
  createdAt?: Date;
}

export interface BackupCode extends Row {
  code: number;
  userId: number;
  used?: boolean;
}

export interface AccessToken extends IdRow {
  name?: string;
  description?: string;
  jwtAccessToken?: string;
  scopes?: string;
  userId: number;
  expiresAt?: Date;
}
export interface AccessTokenResponse {
  id: number;
  userId: number;
  scopes: string;
  jti: string;
  sub: Tokens;
  exp: number;
}

export interface Session extends IdRow {
  userId: number;
  jwtToken: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
}
