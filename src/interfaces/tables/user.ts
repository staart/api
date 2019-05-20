import {
  UserRole,
  NotificationEmails,
  Genders,
  NotificationCategories
} from "../enum";

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
