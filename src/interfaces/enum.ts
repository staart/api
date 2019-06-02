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
  EMAIL_VERIFIED = "email.verified",
  MEMBERSHIP_CREATED = "membership.created",
  MEMBERSHIP_UPDATED = "membership.updated",
  MEMBERSHIP_DELETED = "membership.deleted",
  BILLING_UPDATED = "billing.updated",
  API_KEY_CREATED = "apiKey.created",
  API_KEY_UPDATED = "apiKey.updated",
  API_KEY_DELETED = "apiKey.deleted"
}

export enum ErrorCode {
  NOT_FOUND = "404/not-found",
  MISSING_TOKEN = "422/missing-token",
  INVALID_TOKEN = "401/invalid-token",
  MISSING_PRIMARY_EMAIL = "422/missing-primary-email",
  MISSING_PASSWORD = "422/missing-password",
  MISSING_FIELD = "422/missing-field",
  EMAIL_EXISTS = "422/email-exists",
  USER_NOT_FOUND = "404/user-not-found",
  MEMBERSHIP_NOT_FOUND = "404/membership-not-found",
  ORGANIZATION_NOT_FOUND = "404/organization-not-found",
  INVALID_LOGIN = "401/invalid-login",
  INCORRECT_PASSWORD = "401/incorrect-password",
  INSUFFICIENT_PERMISSION = "401/insufficient-permission",
  DEFAULT = "500/server-error",
  EMAIL_CANNOT_DELETE = "400/email.cannotDelete",
  UNVERIFIED_EMAIL = "401/unverified-email",
  GOOGLE_AUTH_ERROR = "401/google-auth-error",
  UNAPPROVED_LOCATION = "401/unapproved-location",
  CANNOT_DELETE_SOLE_OWNER = "400/cannot-delete-sole-owner",
  CANNOT_UPDATE_SOLE_OWNER = "400/cannot-update-sole-owner",
  USER_IS_MEMBER_ALREADY = "400/user-is-member-already",
  STRIPE_NO_CUSTOMER = "404/no-customer",
  NOT_ENABLED_2FA = "400/invalid-2fa-token",
  INVALID_2FA_TOKEN = "401/invalid-2fa-token"
}

export enum Templates {
  EMAIL_VERIFY = "email-verify",
  PASSWORD_RESET = "password-reset",
  UNAPPROVED_LOCATION = "unapproved-location"
}

export enum Tokens {
  LOGIN = "auth",
  TWO_FACTOR = "2fa",
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
  ORGANIZATION_EVENT = "organization-event",
  USER_RECENT_EVENTS = "user-recent-events",
  ORGANIZATION_RECENT_EVENTS = "organization-recent-events",
  USER_MEMBERSHIPS = "user-memberships",
  USER_MEMBERSHIP_ORGANIZATION = "user-membership-org",
  ORGANIZATION_MEMBERSHIPS = "memberships",
  MEMBERSHIP = "membership",
  ORGANIZATION = "organization",
  APPROVE_LOCATIONS = "approved-locations",
  APPROVE_LOCATION = "approved-location",
  IP_LOOKUP = "ip-lookup",
  API_KEYS = "api-keys",
  API_KEY = "api-key",
  NOTIFICATION = "notification",
  USER_NOTIFICATIONS = "user-notifications"
}

export enum Authorizations {
  CREATE = "create",
  READ = "read",
  CREATE_SECURE = "create-secure",
  READ_SECURE = "read-secure",
  UPDATE = "update",
  UPDATE_SECURE = "update-secure",
  DELETE = "delete",
  DELETE_SECURE = "delete-secure",
  INVITE_MEMBER = "invite-member",
  IMPERSONATE = "impersonate"
}

export enum Genders {
  MALE = "m",
  FEMALE = "f",
  NON_BINARY = "n",
  UNKNOWN = "x"
}

export enum NotificationCategories {
  JOINED_ORGANIZATION = "joined-organization"
}
