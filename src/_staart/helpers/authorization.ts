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
import { prisma } from "./prisma";

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
    // A user can read another user in the same group, as long as they're not a basic member
    if (action === UserScopes.READ_USER)
      if (userMemberships[similarMembership].role) allowed = true;
  });

  return allowed;
};

/**
 * Whether an access token can perform an action for an group
 */
const canAccessTokenUser = (
  accessToken: accessTokens,
  action: UserScopes,
  target: users
) => {
  if (accessToken.userId !== target.id) return false;

  if (!accessToken.scopes) return false;

  if (Array.isArray(accessToken.scopes) && accessToken.scopes.includes(action))
    return true;

  return false;
};

/**
 * Whether a user can perform an action on an group
 */
const canUserGroup = async (user: users, action: OrgScopes, target: groups) => {
  // A super user can do anything
  if (user.role === "SUDO") return true;

  const memberships = await prisma.memberships.findMany({ where: { user } });
  const targetMemberships = memberships.filter((m) => m.groupId === target.id);

  let allowed = false;
  targetMemberships.forEach((membership) => {
    // An group owner can do anything
    if (membership.role === "OWNER") allowed = true;

    // An group admin can do anything too
    if (membership.role === "ADMIN") allowed = true;

    // An group member can read, not edit/delete/invite
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
      membership.groupId === target.groupId &&
      (membership.role === "OWNER" || membership.role === "ADMIN")
    )
      allowed = true;

    // Another member can view
    if (
      membership.groupId === target.groupId &&
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
 * Whether an API key can perform an action for an group
 */
const canApiKeyGroup = (apiKey: apiKeys, action: OrgScopes, target: groups) => {
  // An API key can only work in its own group
  if (apiKey.groupId !== target.id) return false;

  // If it has no scopes, it has no permissions
  if (!apiKey.scopes) return false;

  if (Array.isArray(apiKey.scopes) && apiKey.scopes.includes(action))
    return true;

  return false;
};

/**
 * Whether a user has authorization to perform an action
 */
export const can = async (
  user: number | users | ApiKeyResponse | AccessTokenResponse,
  action: OrgScopes | UserScopes | SudoScopes,
  targetType: "user" | "group" | "membership" | "sudo",
  target?: number | users | groups | memberships
) => {
  let requestFromType: "users" | "apiKeys" | "accessTokens" = "users";

  /**
   * First, we figure out what the first parameter is
   * If it's a number, it can only be a user ID we'll convert to user
   */
  if (typeof user === "object") {
    if ((user as ApiKeyResponse).sub === Tokens.API_KEY) {
      requestFromType = "apiKeys";
    } else if ((user as AccessTokenResponse).sub === Tokens.ACCESS_TOKEN) {
      requestFromType = "accessTokens";
    }
  } else {
    const result = await getUserById(user);
    if (!result) throw new Error(USER_NOT_FOUND);
    user = result;
  }

  /**
   * Now, `user` is of type "users", "ApiKeyResponse", or "AccessTokenResponse"
   * and `requestFromType` will tell us what type it is
   * We find what the correct target is
   */
  if (typeof target === "number") {
    if (targetType === "membership") {
      const membership = await prisma.memberships.findOne({
        where: { id: target },
      });
      if (!membership) throw new Error(USER_NOT_FOUND);
      target = membership;
    } else if (targetType === "group") {
      const group = await getGroupById(target);
      target = group;
    } else {
      // Target is a user
      if (requestFromType === "users" && user.id === target) {
        target = user as users;
      } else {
        const targetUser = await getUserById(target);
        if (!targetUser) throw new Error(USER_NOT_FOUND);
        target = targetUser;
      }
    }
  }

  if (requestFromType === "apiKeys") {
    const apiKeyDetails = await prisma.apiKeys.findOne({
      where: { id: (user as ApiKeyResponse).id },
    });
    if (!apiKeyDetails || !target) throw new Error(INVALID_TOKEN);
    return canApiKeyGroup(apiKeyDetails, action as OrgScopes, target as groups);
  } else if (requestFromType === "accessTokens") {
    const accessTokenDetails = await prisma.accessTokens.findOne({
      where: { id: (user as ApiKeyResponse).id },
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
    } else if (targetType === "group") {
      return canUserGroup(user as users, action as OrgScopes, target as groups);
    }
  }

  return canUserSudo(user as users, action as SudoScopes);
};
