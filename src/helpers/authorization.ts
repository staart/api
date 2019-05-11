import { User } from "../interfaces/tables/user";
import { Organization } from "../interfaces/tables/organization";
import {
  ErrorCode,
  Authorizations,
  UserRole,
  MembershipRole
} from "../interfaces/enum";
import { getUser } from "../crud/user";
import { getUserMemberships, getMembership } from "../crud/membership";
import { getOrganization } from "../crud/organization";
import { Membership } from "../interfaces/tables/memberships";

/**
 * Whether a user can perform an action on another user
 */
const canUserUser = async (
  user: User,
  action: Authorizations,
  target: User
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A user can do anything to herself
  if (user.id === target.id) return true;

  const userMemberships = await getUserMemberships(user);
  const targetMemberships = await getUserMemberships(target);

  const similarMemberships: number[] = [];
  userMemberships.forEach((userMembership, index) => {
    targetMemberships.forEach(targetMembership => {
      if (userMembership.id && userMembership.id === targetMembership.id)
        similarMemberships.push(index);
    });
  });

  similarMemberships.forEach(similarMembership => {
    // A reseller can view/edit/delete users in her organization
    if (
      user.role == UserRole.RESELLER &&
      [
        Authorizations.READ,
        Authorizations.UPDATE,
        Authorizations.DELETE
      ].includes(action)
    )
      return true;

    if (action == Authorizations.READ) {
      // A user can read another user in the same organization, as long as they're not a basic member
      if (userMemberships[similarMembership].role != MembershipRole.BASIC)
        return true;
    }
  });

  return false;
};

/**
 * Whether a user can perform an action on an organization
 */
const canUserOrganization = async (
  user: User,
  action: Authorizations,
  target: Organization
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  const memberships = await getUserMemberships(user);
  const targetMemberships = memberships.filter(
    m => m.organizationId === target.id
  );

  targetMemberships.forEach(membership => {
    // A non-member cannot do anything
    if (membership.organizationId != target.id) return false;

    // An organization owner can do anything
    if (membership.role == MembershipRole.OWNER) return true;

    // An organization admin can do anything too
    if (membership.role == MembershipRole.ADMIN) return true;

    // An organization manager can do anything but delete
    if (
      membership.role == MembershipRole.MANAGER &&
      action != Authorizations.DELETE
    )
      return true;

    // An organization member can read, not edit/delete/invite
    if (
      membership.role == MembershipRole.MEMBER &&
      action == Authorizations.READ
    )
      return true;
  });

  return false;
};

/**
 * Whether a user can perform an action on a membership
 */
const canUserMembership = async (
  user: User,
  action: Authorizations,
  target: Membership
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A member can do anything to herself
  if (user.id == target.userId) return true;

  const memberships = await getUserMemberships(user);
  memberships.forEach(membership => {
    // A different organization member cannot edit a membership
    if (membership.organizationId != target.organizationId) return false;

    // An admin, owner, or manager can edit
    if (
      [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
        MembershipRole.MANAGER
      ].includes(membership.role)
    )
      return true;
  });

  return false;
};

/**
 * Whether a user has authorization to perform an action
 * @param ipAddress  IP address for the new location
 */
export const can = async (
  user: User | number,
  action: Authorizations,
  targetType: "user" | "organization" | "membership",
  target: User | Organization | Membership | number
) => {
  let userObject;
  if (typeof user === "number") {
    userObject = await getUser(user);
  } else {
    userObject = user;
  }
  let targetObject;
  if (typeof target === "string") target = parseInt(target);
  if (typeof target == "number") {
    if (targetType === "user") {
      targetObject = await getUser(target);
    } else if (targetType === "organization") {
      targetObject = await getOrganization(target);
    } else {
      targetObject = await getMembership(target);
    }
  } else {
    targetObject = target;
  }
  if (!userObject.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  if (targetType === "user") {
    return await canUserUser(userObject, action, <User>targetObject);
  } else if (targetType === "organization") {
    return await canUserOrganization(userObject, action, <Organization>(
      targetObject
    ));
  } else {
    return await canUserMembership(userObject, action, <Membership>(
      targetObject
    ));
  }
};
