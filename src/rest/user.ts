import {
  ErrorCode,
  MembershipRole,
  UserRole,
  EventType
} from "../interfaces/enum";
import { getUser, updateUser, getUserApprovedLocations } from "../crud/user";
import {
  getUserOrganizationId,
  getUserMembershipObject,
  getUserOrganization
} from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { Locals } from "../interfaces/general";
import { createEvent, getUserEvents } from "../crud/event";
import { getUserEmails } from "../crud/email";

export const getUserFromId = async (userId: number, tokenId: number) => {
  const user = await getUser(userId);
  // You can access this user if:
  // (i) You're the user
  if (userId == tokenId) return user;
  // (ii) You're a super-admin
  const tokenUser = await getUser(tokenId);
  if (tokenUser.role == UserRole.ADMIN) return user;
  // You're both in the same organization
  const tokenOrganization = await getUserMembershipObject(tokenUser);
  const userOrganizationId = await getUserOrganizationId(user);
  // and you're not a basic member
  if (
    tokenOrganization.organizationId == userOrganizationId &&
    tokenOrganization.role !== MembershipRole.BASIC
  )
    return user;
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateUserForUser = async (
  tokenUserId: number,
  updateUserId: number,
  data: User,
  locals: Locals
) => {
  const tokenUser = await getUser(tokenUserId);
  if (tokenUserId == updateUserId || tokenUser.role == UserRole.ADMIN) {
    await updateUser(updateUserId, data);
    await createEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_UPDATED,
        data: { id: updateUserId, data }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (userId: number) => {
  const user = await getUser(userId);
  const organization = await getUserOrganization(userId);
  const membership = await getUserMembershipObject(userId);
  const emails = await getUserEmails(userId);
  const events = await getUserEvents(userId);
  const approvedLocations = await getUserApprovedLocations(userId);
  return { user, organization, membership, emails, events, approvedLocations };
};
