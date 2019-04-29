import { UserRole, NotificationEmails } from "../enum";

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
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApprovedLocation {
  id?: number;
  userId?: number;
  subnet?: string;
  createdAt?: Date;
}
