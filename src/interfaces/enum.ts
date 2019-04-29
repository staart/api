export enum MembershipRole {
  OWNER = 1,
  ADMIN = 2,
  MANAGER = 3,
  MEMBER = 4,
  BASIC = 5
}

export enum UserRole {
  MEMBER = 1,
  RESELLER = 2,
  ADMIN = 3
}

export enum NotificationEmails {
  SECURITY = 0,
  ACCOUNT = 1,
  GENERAL = 2,
  PROMOTIONS = 3
}

export enum EventType {
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  AUTH_REFRESH = "auth.refresh",
  AUTH_LOGIN = "auth.login",
  AUTH_LOGIN_BACKUP_CODE = "auth.login_backupCode",
  AUTH_LOGIN_GOOGLE = "auth.login_google",
  AUTH_PASSWORD_CHANGED = "auth.password_changed",
  AUTH_PASSWORD_RESET_REQUESTED = "auth.passwordReset",
  ORGANIZATION_CREATED = "organization.created",
  ORGANIZATION_UPDATED = "organization.updated",
  ORGANIZATION_DELETED = "organization.deleted",
  EMAIL_CREATED = "email.created",
  EMAIL_UPDATED = "email.updated",
  EMAIL_DELETED = "email.deleted",
  EMAIL_VERIFIED = "email.verified"
}

export enum ErrorCode {
  MISSING_TOKEN = "422/missing-token",
  INVALID_TOKEN = "401/invalid-token",
  MISSING_PRIMARY_EMAIL = "422/missing-primary-email",
  MISSING_PASSWORD = "422/missing-password",
  MISSING_FIELD = "422/missing-field",
  USER_NOT_FOUND = "404/user-not-found",
  INVALID_LOGIN = "401/invalid-login",
  INSUFFICIENT_PERMISSION = "401/insufficient-permission",
  DEFAULT = "500/server-error",
  EMAIL_CANNOT_DELETE = "400/email.cannotDelete",
  UNVERIFIED_EMAIL = "401/unverified-email"
}

export enum Templates {
  EMAIL_VERIFY = "email-verify",
  PASSWORD_RESET = "password-reset"
}

export enum Tokens {
  LOGIN = "auth",
  REFRESH = "refresh",
  PASSWORD_RESET = "password-reset",
  EMAIL_VERIFY = "email-verify"
}
