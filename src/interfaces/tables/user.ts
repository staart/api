import { QueryTable, NumberColumn, StringColumn, DateColumn, BooleanColumn } from "type-sql";

export interface User {
  id: number;
  name: string;
  nickname: string;
  primaryEmail?: number;
  password: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: boolean;
  country?: string;
  timezone?: string;
  notificationEmails?: 1 | 2 | 3 | 4;
  preferredLanguage?: string;
  prefersReducedMotion?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserTable extends QueryTable<User, number> {
  id = new NumberColumn(this, "id");
  name = new StringColumn(this, "name");
  nickname = new StringColumn(this, "nickname");
  primaryEmail = new NumberColumn(this, "primaryEmail");
  password = new StringColumn(this, "password");
  twoFactorEnabled = new BooleanColumn(this, "twoFactorEnabled");
  twoFactorSecret = new StringColumn(this, "twoFactorSecret");
  country = new StringColumn(this, "country");
  timezone = new StringColumn(this, "timezone");
  notificationEmails = new NumberColumn(this, "notificationEmails");
  preferredLanguage = new StringColumn(this, "preferredLanguage");
  prefersReducedMotion = new BooleanColumn(this, "prefersReducedMotion");
  createdAt = new DateColumn(this, "createdAt");
  updatedAt = new DateColumn(this, "updatedAt");
}

export const USER = new UserTable("User");
