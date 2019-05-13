import { UserRole, NotificationEmails, Genders } from "../enum";

export interface User {
  id?: number;
  name: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApprovedLocation {
  id?: number;
  userId?: number;
  subnet?: string;
  createdAt?: Date;
}

export interface ApiKey {
  apiKey?: string;
  secretKey?: string;
  userId: number;
  organizationId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
