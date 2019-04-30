import { ErrorCode, EventType, Authorizations } from "../interfaces/enum";
import { getUser, updateUser, getUserApprovedLocations } from "../crud/user";
import {
  getUserMembershipObject,
  getUserOrganization
} from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { Locals } from "../interfaces/general";
import { createEvent, getUserEvents, getUserRecentEvents } from "../crud/event";
import { getUserEmails } from "../crud/email";
import { can } from "../helpers/authorization";

export const getUserFromId = async (userId: number, tokenUserId: number) => {
  if (await can(tokenUserId, Authorizations.READ, "user", userId))
    return getUser(userId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateUserForUser = async (
  tokenUserId: number,
  updateUserId: number,
  data: User,
  locals: Locals
) => {
  if (await can(tokenUserId, Authorizations.UPDATE, "user", updateUserId)) {
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

export const getRecentEventsForUser = async (
  tokenUserId: number,
  dataUserId: number
) => {
  if (await can(tokenUserId, Authorizations.READ_SECURE, "user", dataUserId))
    return await getUserRecentEvents(dataUserId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (
  tokenUserId: number,
  userId: number
) => {
  if (!(await can(tokenUserId, Authorizations.READ_SECURE, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const user = await getUser(userId);
  const organization = await getUserOrganization(userId);
  const membership = await getUserMembershipObject(userId);
  const emails = await getUserEmails(userId);
  const events = await getUserEvents(userId);
  const approvedLocations = await getUserApprovedLocations(userId);
  return { user, organization, membership, emails, events, approvedLocations };
};
