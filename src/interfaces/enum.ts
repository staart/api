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
  AUTH_APPROVE_LOCATION = "auth.approveLocation",
  ORGANIZATION_CREATED = "organization.created",
  ORGANIZATION_UPDATED = "organization.updated",
  ORGANIZATION_DELETED = "organization.deleted",
  EMAIL_CREATED = "email.created",
  EMAIL_UPDATED = "email.updated",
  EMAIL_DELETED = "email.deleted",
  EMAIL_VERIFIED = "email.verified"
}

export enum ErrorCode {
  NOT_FOUND = "404/not-found",
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
  UNVERIFIED_EMAIL = "401/unverified-email",
  GOOGLE_AUTH_ERROR = "401/google-auth-error",
  UNAPPROVED_LOCATION = "401/unapproved-location"
}

export enum Templates {
  EMAIL_VERIFY = "email-verify",
  PASSWORD_RESET = "password-reset",
  UNAPPROVED_LOCATION = "unapproved-location"
}

export enum Tokens {
  LOGIN = "auth",
  REFRESH = "refresh",
  PASSWORD_RESET = "password-reset",
  EMAIL_VERIFY = "email-verify",
  APPROVE_LOCATION = "approve-location"
}

export enum CacheCategories {
  USER = "user",
  USER_EMAILS = "user-emails",
  USER_VERIFIED_EMAILS = "user-verified-emails",
  EMAIL = "email",
  USER_EVENT = "user-event",
  USER_RECENT_EVENTS = "user-recent-events",
  ORGANIZATION_MEMBERSHIPS = "memberships",
  MEMBERSHIP = "membership",
  ORGANIZATION = "organization",
  APPROVE_LOCATIONS = "approved-locations",
  APPROVE_LOCATION = "approved-location"
}

export enum Authorizations {
  CREATE = "create",
  READ = "read",
  READ_SECURE = "read-secure",
  UPDATE = "update",
  DELETE = "delete",
  INVITE_MEMBER = "invite-member",
  IMPERSONATE = "impersonate"
}
