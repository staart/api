/** Scopes for a user */
export const userScopes = {
  'user-{userId}:write-api-key-*': 'Create and update API keys',
  'user-{userId}:read-api-key-*': 'Read API keys',
  'user-{userId}:delete-api-key-*': 'Delete API keys',
  'user-{userId}:read-api-key-logs-*': 'Read API key logs',
  'user-{userId}:read-approved-subnet-*': 'Read approved subnets',
  'user-{userId}:delete-approved-subnet-*': 'Unapproved subnet',
  'user-{userId}:write-email-*': 'Create and update emails',
  'user-{userId}:read-email-*': 'Read emails',
  'user-{userId}:delete-email-*': 'Delete emails',
  'user-{userId}:write-membership-*': 'Create groups',
  'user-{userId}:read-membership-*': 'Read memberships',
  'user-{userId}:delete-membership-*': 'Delete memberships',
  'user-{userId}:delete-mfa-*': 'Disable MFA',
  'user-{userId}:write-mfa-regenerate': 'Regenerate MFA backup codes',
  'user-{userId}:write-mfa-totp': 'Enable TOTP-based MFA',
  'user-{userId}:write-mfa-sms': 'Enable SMS-based MFA',
  'user-{userId}:write-mfa-email': 'Enable email-based MFA',
  'user-{userId}:read-session-*': 'Read sessions',
  'user-{userId}:delete-session-*': 'Log out of sessions',
  'user-{userId}:read-info': 'Read user details',
  'user-{userId}:write-info': 'Update user details',
  'user-{userId}:deactivate': 'Delete user account',
  'user-{userId}:merge': 'Merge two users',
};

/** Scopes for a group owner */
export const groupOwnerScopes = {
  'group-{groupId}:write-api-key-*': 'Create and update API keys',
  'group-{groupId}:read-api-key-*': 'Read API keys',
  'group-{groupId}:delete-api-key-*': 'Delete API keys',
  'group-{groupId}:read-api-key-logs-*': 'Read API key logs',
  'group-{groupId}:read-audit-log-*': 'Read audit log',
  'group-{groupId}:write-domain-*': 'Create and update domains',
  'group-{groupId}:read-domain-*': 'Read domains',
  'group-{groupId}:delete-domain-*': 'Delete domains',
  'group-{groupId}:read-info': 'Read apartment details',
  'group-{groupId}:write-info': 'Update apartment details',
  'group-{groupId}:delete': 'Delete apartment',
  'group-{groupId}:write-membership-*': 'Create and update memberships',
  'group-{groupId}:read-membership-*': 'Read memberships',
  'group-{groupId}:delete-membership-*': 'Delete memberships',
  'group-{groupId}:write-billing': 'Create and update billing details',
  'group-{groupId}:read-billing': 'Read billing details',
  'group-{groupId}:delete-billing': 'Delete billing details',
  'group-{groupId}:read-invoice-*': 'Read invoices',
  'group-{groupId}:write-source-*': 'Create and update payment methods',
  'group-{groupId}:read-source-*': 'Read payment methods',
  'group-{groupId}:delete-source-*': 'Delete payment methods',
  'group-{groupId}:write-subscription-*': 'Create and update subscriptions',
  'group-{groupId}:read-subscription-*': 'Read subscriptions',
  'group-{groupId}:delete-subscription-*': 'Delete subscriptions',
  'group-{groupId}:write-webhook-*': 'Create and update webhooks',
  'group-{groupId}:read-webhook-*': 'Read webhooks',
  'group-{groupId}:delete-webhook-*': 'Delete webhooks',
};

/**
 * Scopes for a group admin
 * Admins can do everything except deleting the group or removing members
 */
export const groupAdminScopes = {
  'group-{groupId}:write-api-key-*': 'Create and update API keys',
  'group-{groupId}:read-api-key-*': 'Read API keys',
  'group-{groupId}:delete-api-key-*': 'Delete API keys',
  'group-{groupId}:read-api-key-logs-*': 'Read API key logs',
  'group-{groupId}:read-audit-log-*': 'Read audit log',
  'group-{groupId}:write-domain-*': 'Create and update domains',
  'group-{groupId}:read-domain-*': 'Read domains',
  'group-{groupId}:delete-domain-*': 'Delete domains',
  'group-{groupId}:read-info': 'Read apartment details',
  'group-{groupId}:write-info': 'Update apartment details',
  'group-{groupId}:write-membership-*': 'Create and update memberships',
  'group-{groupId}:read-membership-*': 'Read memberships',
  'group-{groupId}:write-billing': 'Create and update billing details',
  'group-{groupId}:read-billing': 'Read billing details',
  'group-{groupId}:delete-billing': 'Delete billing details',
  'group-{groupId}:read-invoice-*': 'Read invoices',
  'group-{groupId}:write-source-*': 'Create and update payment methods',
  'group-{groupId}:read-source-*': 'Read payment methods',
  'group-{groupId}:delete-source-*': 'Delete payment methods',
  'group-{groupId}:write-subscription-*': 'Create and update subscriptions',
  'group-{groupId}:read-subscription-*': 'Read subscriptions',
  'group-{groupId}:delete-subscription-*': 'Delete subscriptions',
  'group-{groupId}:write-webhook-*': 'Create and update webhooks',
  'group-{groupId}:read-webhook-*': 'Read webhooks',
  'group-{groupId}:delete-webhook-*': 'Delete webhooks',
};

/**
 * Scopes for a group member
 * Members have readonly access
 */
export const groupMemberScopes = {
  'group-{groupId}:read-api-key-*': 'Read API keys',
  'group-{groupId}:read-api-key-logs-*': 'Read API key logs',
  'group-{groupId}:read-audit-log-*': 'Read audit log',
  'group-{groupId}:read-domain-*': 'Read domains',
  'group-{groupId}:read-info': 'Read apartment details',
  'group-{groupId}:read-membership-*': 'Read memberships',
  'group-{groupId}:read-billing': 'Read billing details',
  'group-{groupId}:read-invoice-*': 'Read invoices',
  'group-{groupId}:read-source-*': 'Read payment methods',
  'group-{groupId}:read-subscription-*': 'Read subscriptions',
  'group-{groupId}:read-webhook-*': 'Read webhooks',
};
