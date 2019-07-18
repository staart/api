import { User } from "../interfaces/tables/user";
import { Organization } from "../interfaces/tables/organization";
import {
  ErrorCode,
  Authorizations,
  UserRole,
  MembershipRole,
  ApiAuthorizations,
  Tokens
} from "../interfaces/enum";
import { getUser } from "../crud/user";
import { getUserMemberships, getMembership } from "../crud/membership";
import { getOrganization } from "../crud/organization";
import { Membership } from "../interfaces/tables/memberships";
import { ApiKeyResponse } from "./jwt";

/**
 * Whether a user can perform an action on another user
 */
const canUserUser = async (
  user: User,
  action: Authorizations | ApiAuthorizations,
  target: User
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A user can do anything to herself
  if (user.id == target.id) return true;

  const userMemberships = await getUserMemberships(user);
  const targetMemberships = await getUserMemberships(target);

  const similarMemberships: number[] = [];
  userMemberships.forEach((userMembership, index) => {
    targetMemberships.forEach(targetMembership => {
      if (userMembership.id && userMembership.id == targetMembership.id)
        similarMemberships.push(index);
    });
  });

  let allowed = false;
  similarMemberships.forEach(similarMembership => {
    // A reseller can view/edit/delete users in her organization
    if (
      user.role == UserRole.RESELLER &&
      (action == Authorizations.READ ||
        action == Authorizations.UPDATE ||
        action == Authorizations.DELETE)
    )
      allowed = true;

    if (action == Authorizations.READ) {
      // A user can read another user in the same organization, as long as they're not a basic member
      if (userMemberships[similarMembership].role != MembershipRole.BASIC)
        allowed = true;
    }
  });

  return allowed;
};

/**
 * Whether a user can perform an action on an organization
 */
const canUserOrganization = async (
  user: User,
  action: Authorizations | ApiAuthorizations,
  target: Organization
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  const memberships = await getUserMemberships(user);
  const targetMemberships = memberships.filter(
    m => m.organizationId == target.id
  );

  let allowed = false;
  targetMemberships.forEach(membership => {
    // An organization owner can do anything
    if (membership.role == MembershipRole.OWNER) allowed = true;

    // An organization admin can do anything too
    if (membership.role == MembershipRole.ADMIN) allowed = true;

    // An organization manager can do anything but delete
    if (
      membership.role == MembershipRole.MANAGER &&
      action != Authorizations.DELETE &&
      action != Authorizations.DELETE_SECURE
    )
      allowed = true;

    // An organization member can read, not edit/delete/invite
    if (
      membership.role == MembershipRole.MEMBER &&
      action == Authorizations.READ
    )
      allowed = true;
  });

  return allowed;
};

/**
 * Whether a user can perform an action on a membership
 */
const canUserMembership = async (
  user: User,
  action: Authorizations | ApiAuthorizations,
  target: Membership
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A member can do anything to herself
  if (user.id == target.userId) return true;

  const memberships = await getUserMemberships(user);

  let allowed = false;
  memberships.forEach(membership => {
    // An admin, owner, or manager can edit
    if (
      membership.organizationId == target.organizationId &&
      (membership.role == MembershipRole.OWNER ||
        membership.role == MembershipRole.ADMIN ||
        membership.role == MembershipRole.MANAGER)
    )
      allowed = true;

    // Another member can view
    if (
      membership.organizationId == target.organizationId &&
      membership.role == MembershipRole.MEMBER &&
      action == Authorizations.READ
    )
      allowed = true;
  });

  return allowed;
};

/**
 * Whether a user can perform an action for the backend
 */
const canUserGeneral = async (
  user: User,
  action: Authorizations | ApiAuthorizations
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  return false;
};

/**
 * Whether an API key can perform an action for an organization
 */
const canApiKeyOrganization = (
  apiKey: ApiKeyResponse,
  action: Authorizations | ApiAuthorizations,
  target: Organization
) => {
  if (apiKey.organizationId != target.id) return false;

  if (!apiKey.scopes) return false;

  if (
    apiKey.scopes.includes("orgRead") &&
    (action == Authorizations.READ || action == Authorizations.READ_SECURE)
  )
    return true;

  if (
    apiKey.scopes.includes("orgUpdate") &&
    (action == Authorizations.UPDATE ||
      action == Authorizations.UPDATE_SECURE ||
      action == Authorizations.CREATE ||
      action == Authorizations.CREATE_SECURE ||
      action == Authorizations.DELETE ||
      action == Authorizations.DELETE_SECURE)
  )
    return true;

  return false;
};

/**
 * Whether a user has authorization to perform an action
 */
export const can = async (
  user: User | number | ApiKeyResponse,
  action: Authorizations | ApiAuthorizations,
  targetType: "user" | "organization" | "membership" | "general",
  target?: User | Organization | Membership | number
) => {
  let userObject: User | ApiKeyResponse | undefined = undefined;
  let isApiKey = false;

  if (typeof user === "object") {
    if ((user as ApiKeyResponse).sub == Tokens.API_KEY) {
      isApiKey = true;
    } else {
      userObject = user as User;
    }
  } else {
    userObject = await getUser(user as number);
  }

  if (isApiKey) {
    if (target && typeof target === "object") {
      return await canApiKeyOrganization(
        user as ApiKeyResponse,
        action,
        target
      );
    } else if (target) {
      target = await getOrganization(target);
      return await canApiKeyOrganization(
        user as ApiKeyResponse,
        action,
        target
      );
    } else {
      throw new Error(ErrorCode.ORGANIZATION_NOT_FOUND);
    }
  }

  if (!userObject || !userObject.id) throw new Error(ErrorCode.USER_NOT_FOUND);

  let targetObject: User | Organization | Membership;
  if (targetType === "user") {
    if (typeof target === "string" || typeof target === "number")
      targetObject = await getUser(target);
    else targetObject = target as User;
    return await canUserUser(userObject, action, targetObject as User);
  } else if (targetType === "organization") {
    if (typeof target === "string" || typeof target === "number")
      targetObject = await getOrganization(target);
    else targetObject = target as Organization;
    return await canUserOrganization(
      userObject,
      action,
      targetObject as Organization
    );
  } else if (targetType === "membership") {
    if (typeof target === "string" || typeof target === "number")
      targetObject = await getMembership(target);
    else targetObject = target as Membership;
    return await canUserMembership(
      userObject,
      action,
      targetObject as Membership
    );
  }

  return await canUserGeneral(userObject, action);
};
