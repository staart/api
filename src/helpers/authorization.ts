import { User } from "../interfaces/tables/user";
import { Organization } from "../interfaces/tables/organization";
import {
  ErrorCode,
  Authorizations,
  UserRole,
  MembershipRole
} from "../interfaces/enum";
import { getUser } from "../crud/user";
import { getUserMembershipObject, getMembership } from "../crud/membership";
import { getOrganization } from "../crud/organization";
import { Membership } from "../interfaces/tables/memberships";

const canUserUser = async (
  user: User,
  action: Authorizations,
  target: User
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A user can do anything to herself
  if (user.id === target.id) return true;

  const userMembership = await getUserMembershipObject(user);
  const userOrganizationId = userMembership.organizationId;
  const targetMembership = await getUserMembershipObject(target);
  const targetOrganizationId = targetMembership.organizationId;

  // A reseller can view/edit/delete users in her organization
  if (
    userOrganizationId === targetOrganizationId &&
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
    if (
      userOrganizationId === targetOrganizationId &&
      userMembership.role != MembershipRole.BASIC
    )
      return true;
  }

  return false;
};

const canUserOrganization = async (
  user: User,
  action: Authorizations,
  target: Organization
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  const membership = await getUserMembershipObject(user);

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
  if (membership.role == MembershipRole.MEMBER && action == Authorizations.READ)
    return true;

  return false;
};

const canUserMembership = async (
  user: User,
  action: Authorizations,
  target: Membership
) => {
  // A super user can do anything
  if (user.role == UserRole.ADMIN) return true;

  // A member can do anything to herself
  if (user.id == target.userId) return true;

  const membership = await getUserMembershipObject(user);

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

  return false;
};

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
