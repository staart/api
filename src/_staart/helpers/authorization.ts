import { Model, newEnforcer, StringAdapter } from "casbin";
import { join } from "path";
import { ScopesAdmin, ScopesGroup, ScopesUser } from "../config";
import { getUserById } from "../services/user.service";
import { AccessTokenResponse, ApiKeyResponse } from "./jwt";
import { prisma } from "./prisma";
import { twtToId } from "./utils";

/**
 * You should not overwrite these scopes
 * Instead, add them to .staartrc.json
 * Acts are prepended to scopes to generate actions
 * "read:" + "users/info" = "read:users/info"
 */
export enum Acts {
  READ = "read:",
  WRITE = "write:",
  DELETE = "delete:",
}

/** Base scopes for users */
export const BaseScopesUser = {
  INFO: "users/info",
  ACCESS_TOKENS: "users/access-tokens",
  EMAILS: "users/emails",
  IDENTITIES: "users/identities",
  MEMBERSHIPS: "users/memberships",
  SECURITY: "users/security",
  SESSIONS: "users/sessions",
};

/** Base scopes for groups */
export const BaseScopesGroup = {
  INFO: "groups/info",
  API_KEYS: "groups/api-keys",
  API_KEY_LOGS: "groups/api-key-logs",
  BILLING: "groups/billing",
  DOMAINS: "groups/domains",
  INVOICES: "groups/invoices",
  MEMBERSHIPS: "groups/memberships",
  SOURCES: "groups/sources",
  SUBSCRIPTIONS: "groups/subscriptions",
  TRANSACTIONS: "groups/transactions",
  WEBHOOKS: "groups/webhooks",
  SECURITY: "groups/security",
};

/** Base scopes for admin users */
export const BaseScopesAdmin = {
  GROUPS: "admin/groups",
  USERS: "admin/users",
  COUPONS: "admin/coupons",
  PAYMENT_EVENTS: "admin/payment-events",
  SERVER_LOGS: "admin/server-logs",
};

/**
 * Generate and fetch the casbin policy for a user
 * @param id - User ID (TWT-encoded)
 */
const getPolicyForUser = async (id: number) => {
  let policy = "";
  const userId = twtToId(id);

  // A user can do anything to themselves, for all user scopes
  Object.values(ScopesUser).forEach((scope) => {
    policy += `p, user-${userId}, user-${userId}, ${Acts.READ}${scope}\n`;
    policy += `p, user-${userId}, user-${userId}, ${Acts.WRITE}${scope}\n`;
  });

  // A user can delete themself
  policy += `p, user-${userId}, user-${userId}, ${Acts.DELETE}${ScopesUser.INFO}\n`;

  // Find all the memberships for this user
  // Then add the rules for each memberships
  const memberships = await prisma.memberships.findMany({
    where: { id },
  });
  for await (const membership of memberships) {
    const membershipId = twtToId(membership.id);
    const groupId = twtToId(membership.groupId);

    // A user can read, write, and delete the membership
    policy += `p, user-${userId}, membership-${membershipId}, ${Acts.READ}${ScopesUser.MEMBERSHIPS}\n`;
    policy += `p, user-${userId}, membership-${membershipId}, ${Acts.WRITE}${ScopesUser.MEMBERSHIPS}\n`;
    policy += `p, user-${userId}, membership-${membershipId}, ${Acts.DELETE}${ScopesUser.MEMBERSHIPS}\n`;

    // Admins can also delete other memberships in a group
    if (membership.role === "ADMIN" || membership.role === "OWNER") {
      // Find all the memberships in a group the user is admin of
      // Then, add the rules to read, write, delete them
      const groupMemberships = await prisma.memberships.findMany({
        where: { groupId: membership.groupId },
      });

      // You can delete the group if you're an admin
      policy += `p, user-${userId}, group-${groupId}, ${Acts.DELETE}${ScopesGroup.INFO}\n`;

      groupMemberships.forEach((groupMembership) => {
        const memberId = twtToId(groupMembership.id);
        // You can read each membership
        policy += `p, user-${userId}, membership-${memberId}, ${Acts.READ}${ScopesUser.MEMBERSHIPS}\n`;

        // If you're the owner, not just an admin, you can edit the membership
        if (groupMembership.role !== "OWNER") {
          policy += `p, user-${userId}, membership-${memberId}, ${Acts.WRITE}${ScopesUser.MEMBERSHIPS}\n`;
          policy += `p, user-${userId}, membership-${memberId}, ${Acts.DELETE}${ScopesUser.MEMBERSHIPS}\n`;
        }
      });
    }

    Object.values(ScopesGroup).forEach((scope) => {
      if (membership.role === "ADMIN" || membership.role === "OWNER") {
        // Admins can read and write groups
        policy += `p, user-${userId}, group-${groupId}, ${Acts.READ}${scope}\n`;
        policy += `p, user-${userId}, group-${groupId}, ${Acts.WRITE}${scope}\n`;
      } else {
        // Non-admins can only read the group
        policy += `p, user-${userId}, group-${groupId}, ${Acts.READ}${scope}\n`;
      }
    });
  }
  const userDetails = await getUserById(id);
  if (userDetails.role === "SUDO") {
    // Superadmins can read and write anything
    Object.values(ScopesAdmin).forEach((scope) => {
      policy += `p, user-${userId}, ${Acts.READ}, ${scope}\n`;
      policy += `p, user-${userId}, ${Acts.WRITE}, ${scope}\n`;
    });
  }
  return policy;
};

// Load the model from root config
const model = new Model();
model.loadModel(join(".", "casbin-model.conf"));

/**
 * Authorization helper to check whether a user has permission to do something
 * Apart from user IDs, API key or access token objects can be used as well
 * @param subject - Subject of the authorization check
 * @param action - Action of the authorization check
 * @param object - Object of the authorization check
 */
export const can = async (
  subject: number | ApiKeyResponse | AccessTokenResponse,
  action: string,
  object: string
) => {
  if (typeof subject === "number") {
    const policy = await getPolicyForUser(subject);
    const enforcer = await newEnforcer(model, new StringAdapter(policy));
    return enforcer.enforce(`user-${subject}`, object, action);
  }
  return false;
};
