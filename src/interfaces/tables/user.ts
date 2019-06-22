import {
  UserRole,
  NotificationEmails,
  Genders,
  NotificationCategories,
  ApiKeyAccess
} from "../enum";

export interface User {
  id?: number;
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
  createdAt?: Date;
  updatedAt?: Date;

  // email is only used for JWT
  email?: string;
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
  access: ApiKeyAccess;
  organizationId: number;
  ipRestrictions?: string;
  referrerRestrictions?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Notification {
  id?: number;
  userId: number;
  category: NotificationCategories;
  text: string;
  link: string;
  read?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
