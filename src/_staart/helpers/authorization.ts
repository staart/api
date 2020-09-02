import {
  accessTokens,
  apiKeys,
  groups,
  memberships,
  users,
} from "@prisma/client";
import { INVALID_TOKEN, USER_NOT_FOUND } from "@staart/errors";
import { OrgScopes, SudoScopes, Tokens, UserScopes } from "../interfaces/enum";
import { getGroupById } from "../services/group.service";
import { getUserById } from "../services/user.service";
import { AccessTokenResponse, ApiKeyResponse } from "./jwt";
import { newEnforcer, Model } from "casbin";
import { prisma } from "./prisma";
import { ScopesUser, ScopesGroup } from "../../config";
import { readFileSync } from "fs-extra";
import { join } from "path";

/**
 * Basic scopes are read and write
 * If you can write, you can create, update, and delete
 */
export enum Acts {
  READ = "read:",
  WRITE = "write:",
  DELETE_MEMBERSHIP = "delete:membership",
}
export const BaseScopesUser = {
  BASIC: "users/basic",
  ACCESS_TOKENS: "users/access-tokens",
  EMAILS: "users/emails",
  IDENTITIES: "users/identities",
  MEMBERSHIPS: "users/memberships",
  SECURITY: "users/security",
  SESSIONS: "users/sessions",
};
export const BaseScopesGroup = {
  BASIC: "groups/basic",
  API_KEYS: "groups/api-keys",
  BILLING: "groups/billing",
  DOMAINS: "groups/domains",
  INVOICES: "groups/invoices",
  MEMBERSHIPS: "groups/memberships",
  SOURCES: "groups/sources",
  SUBSCRIPTIONS: "groups/subscriptions",
  TRANSACTIONS: "groups/transactions",
  WEBHOOKS: "groups/webhooks",
};

const getPolicyForUser = async (userId: number) => {
  let policy = "";
  Object.values(ScopesUser).forEach((scope) => {
    policy += `p, user-${userId}, user-${userId}, ${Acts.READ}${scope}\n`;
    policy += `p, user-${userId}, user-${userId}, ${Acts.WRITE}${scope}\n`;
  });
  const memberships = await prisma.memberships.findMany({
    where: { userId },
  });
  for await (const membership of memberships) {
    policy += `p, user-${userId}, membership-${membership.id}, ${Acts.DELETE_MEMBERSHIP} \n`;
    if (membership.role === "ADMIN" || membership.role === "OWNER") {
      const groupMemberships = await prisma.memberships.findMany({
        where: { groupId: membership.groupId },
      });
      groupMemberships.forEach((groupMembership) => {
        if (groupMembership.role !== "OWNER")
          policy += `p, user-${userId}, membership-${groupMembership.id}, ${Acts.DELETE_MEMBERSHIP} \n`;
      });
    }
    Object.values(ScopesGroup).forEach((scope) => {
      if (membership.role === "ADMIN" || membership.role === "OWNER") {
        policy += `p, user-${userId}, group-${membership.groupId}, ${Acts.READ}${scope}\n`;
        policy += `p, user-${userId}, group-${membership.groupId}, ${Acts.WRITE}${scope}\n`;
      } else {
        policy += `p, user-${userId}, group-${membership.groupId}, ${Acts.READ}${scope}\n`;
      }
    });
  }
  console.log(policy);
  return policy;
};

const model = new Model();
model.loadModelFromText(readFileSync(join(".", "casbin-model.conf"), "utf-8"));

export const can = async (
  subject: number | ApiKeyResponse | AccessTokenResponse,
  object: string,
  action: string
) => {
  if (typeof subject === "number") {
    console.log("Subject is", subject);
    const policy = await getPolicyForUser(subject);
    const enforcer = await newEnforcer(model, policy);
    return enforcer.enforce(`user-${subject}`, object, action);
  }
  return false;
};
