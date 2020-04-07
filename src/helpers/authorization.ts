import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  INVALID_TOKEN,
} from "@staart/errors";
import { OrgScopes, Tokens, UserScopes, SudoScopes } from "../interfaces/enum";
import { ApiKeyResponse, AccessTokenResponse } from "./jwt";
import {
  users,
  organizations,
  memberships,
  access_tokens,
  api_keys,
} from "@prisma/client";
import { prisma } from "./prisma";
import { getUserById } from "../services/user.service";

/**
 * Whether a user can perform an action on another user
 */
const canUserUser = async (user: users, action: UserScopes, target: users) => {
  // A super user can do anything
  if (user.role === "SUDO") return true;

  // A user can do anything to herself
  if (user.id === target.id) return true;

  const userMemberships = await prisma.memberships.findMany({
    where: { user: user },
  });
  const targetMemberships = await prisma.memberships.findMany({
    where: { user: target },
  });

  let allowed = false;

  const similarMemberships: Array<number> = [];
  userMemberships.forEach((userMembership, index) => {
    targetMemberships.forEach((targetMembership) => {
      if (userMembership.id && userMembership.id === targetMembership.id)
        similarMemberships.push(index);
    });
  });

  similarMemberships.forEach((similarMembership) => {
    // A user can read another user in the same organization, as long as they're not a basic member
    if (action === UserScopes.READ_USER)
      if (userMemberships[similarMembership].role) allowed = true;
  });

  return allowed;
};

/**
 * Whether an access token can perform an action for an organization
 */
const canAccessTokenUser = (
  accessToken: access_tokens,
  action: UserScopes,
  target: users
) => {
  if (accessToken.userId !== target.id) return false;

  if (!accessToken.scopes) return false;

  if (accessToken.scopes.includes(action)) return true;

  return false;
};

/**
 * Whether a user can perform an action on an organization
 */
const canUserOrganization = async (
  user: users,
  action: OrgScopes,
  target: organizations
) => {
  // A super user can do anything
  if (user.role === "SUDO") return true;

  const memberships = await prisma.memberships.findMany({ where: { user } });
  const targetMemberships = memberships.filter(
    (m) => m.organizationId === target.id
  );

  let allowed = false;
  targetMemberships.forEach((membership) => {
    // An organization owner can do anything
    if (membership.role === "OWNER") allowed = true;

    // An organization admin can do anything too
    if (membership.role === "ADMIN") allowed = true;

    // An organization reseller can do anything too
    if (membership.role === "RESELLER") allowed = true;

    // An organization member can read, not edit/delete/invite
    if (
      membership.role === "MEMBER" &&
      (action === OrgScopes.READ_ORG ||
        action === OrgScopes.READ_ORG_MEMBERSHIPS ||
        action === OrgScopes.READ_ORG_API_KEYS ||
        action === OrgScopes.READ_ORG_WEBHOOKS)
    )
      allowed = true;
  });

  return allowed;
};

/**
 * Whether a user can perform an action on a membership
 */
const canUserMembership = async (
  user: users,
  action: OrgScopes | UserScopes,
  target: memberships
) => {
  // A super user can do anything
  if (user.role === "SUDO") return true;

  // A member can do anything to herself
  if (user.id === target.userId) return true;

  const memberships = await prisma.memberships.findMany({ where: { user } });

  let allowed = false;
  memberships.forEach((membership) => {
    // An admin, owner, or reseller can edit
    if (
      membership.organizationId === target.organizationId &&
      (membership.role === "OWNER" ||
        membership.role === "ADMIN" ||
        membership.role === "RESELLER")
    )
      allowed = true;

    // Another member can view
    if (
      membership.organizationId === target.organizationId &&
      membership.role === "MEMBER" &&
      action === OrgScopes.READ_ORG_MEMBERSHIPS
    )
      allowed = true;
  });

  return allowed;
};

/**
 * Whether a user can perform an action for the backend
 */
const canUserSudo = async (user: users, action: SudoScopes) => {
  // A super user can do anything
  if (user.role === "SUDO") return true;

  return false;
};

/**
 * Whether an API key can perform an action for an organization
 */
const canApiKeyOrganization = (
  apiKey: api_keys,
  action: OrgScopes,
  target: organizations
) => {
  // An API key can only work in its own organization
  if (apiKey.organizationId !== target.id) return false;

  // If it has no scopes, it has no permissions
  if (!apiKey.scopes) return false;

  if (apiKey.scopes.includes(action)) return true;

  return false;
};

/**
 * Whether a user has authorization to perform an action
 */
export const can = async (
  user: string | users | ApiKeyResponse | AccessTokenResponse,
  action: OrgScopes | UserScopes | SudoScopes,
  targetType: "user" | "organization" | "membership" | "sudo",
  target?: string | users | organizations | memberships
) => {
  let requestFromType: "users" | "api_keys" | "access_tokens" = "users";

  /**
   * First, we figure out what the first parameter is
   * If it's a string, it can only be a user ID we'll convert to user
   */
  if (typeof user === "object") {
    if ((user as ApiKeyResponse).sub === Tokens.API_KEY) {
      requestFromType = "api_keys";
    } else if ((user as AccessTokenResponse).sub === Tokens.ACCESS_TOKEN) {
      requestFromType = "access_tokens";
    }
  } else {
    const result = await getUserById(user);
    if (!result) throw new Error(USER_NOT_FOUND);
    user = result;
  }

  /**
   * Now, `user` is of type "users", "ApiKeyResponse", or "AccessTokenResponse"
   * and `requestFromType` will tell us what type it is
   * We fidn what the correct target is
   */
  if (typeof target === "string") {
    if (targetType === "membership") {
      const membership = await prisma.memberships.findOne({
        where: { id: parseInt(target) },
      });
      if (!membership) throw new Error(USER_NOT_FOUND);
      target = membership;
    } else if (targetType === "organization") {
      const organization = await prisma.organizations.findOne({
        where: { id: parseInt(target) },
      });
      if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
      target = organization;
    } else {
      // Target is a user
      if (requestFromType === "users" && user.id === parseInt(target)) {
        target = user as users;
      } else {
        const targetUser = await getUserById(target);
        if (!targetUser) throw new Error(USER_NOT_FOUND);
        target = targetUser;
      }
    }
  }

  if (requestFromType === "api_keys") {
    const apiKeyDetails = await prisma.api_keys.findOne({
      where: { id: parseInt((user as ApiKeyResponse).id) },
    });
    if (!apiKeyDetails || !target) throw new Error(INVALID_TOKEN);
    return canApiKeyOrganization(
      apiKeyDetails,
      action as OrgScopes,
      target as organizations
    );
  } else if (requestFromType === "access_tokens") {
    const accessTokenDetails = await prisma.access_tokens.findOne({
      where: { id: parseInt((user as ApiKeyResponse).id) },
    });
    if (!accessTokenDetails || !target) throw new Error(INVALID_TOKEN);
    return canAccessTokenUser(
      accessTokenDetails,
      action as UserScopes,
      target as users
    );
  } else {
    if (targetType === "user") {
      return canUserUser(user as users, action as UserScopes, target as users);
    } else if (targetType === "membership") {
      return canUserMembership(
        user as users,
        action as UserScopes | OrgScopes,
        target as memberships
      );
    } else if (targetType === "organization") {
      return canUserOrganization(
        user as users,
        action as OrgScopes,
        target as organizations
      );
    }
  }

  return canUserSudo(user as users, action as SudoScopes);
};
