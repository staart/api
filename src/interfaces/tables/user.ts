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
  notificationEmails?: 1 | 2 | 3 | 4;
  preferredLanguage?: string;
  prefersReducedMotion?: boolean;
  isSudo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
