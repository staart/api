import {
  ErrorCode,
  EventType,
  Authorizations,
  ValidationTypes
} from "../interfaces/enum";
import {
  getUser,
  updateUser,
  getUserApprovedLocations,
  deleteUser,
  deleteAllUserApprovedLocations
} from "../crud/user";
import {
  deleteAllUserMemberships,
  getUserMembershipsDetailed
} from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { Locals } from "../interfaces/general";
import {
  createEvent,
  getUserEvents,
  getUserRecentEvents,
  deleteAllUserEvents
} from "../crud/event";
import { getUserEmails, deleteAllUserEmails } from "../crud/email";
import { can } from "../helpers/authorization";
import { validate } from "../helpers/utils";

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
  if (data.name) validate(data.name, ValidationTypes.TEXT);
  if (data.nickname) validate(data.name, ValidationTypes.TEXT);
  if (data.countryCode) validate(data.name, ValidationTypes.COUNTRY_CODE);
  if (data.password) validate(data.password, ValidationTypes.TEXT);
  if (data.gender) validate(data.gender, ValidationTypes.GENDER);
  if (data.preferredLanguage)
    validate(data.preferredLanguage, ValidationTypes.LANGUAGE);
  if (data.timezone) validate(data.timezone, ValidationTypes.TIMEZONE);
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

export const deleteUserForUser = async (
  tokenUserId: number,
  updateUserId: number,
  locals: Locals
) => {
  if (await can(tokenUserId, Authorizations.DELETE, "user", updateUserId)) {
    await deleteAllUserEmails(updateUserId);
    await deleteAllUserMemberships(updateUserId);
    await deleteAllUserApprovedLocations(updateUserId);
    await deleteAllUserEvents(updateUserId);
    await deleteUser(updateUserId);
    await createEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_DELETED,
        data: { id: updateUserId }
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

export const getMembershipsForUser = async (
  tokenUserId: number,
  dataUserId: number
) => {
  if (await can(tokenUserId, Authorizations.READ, "user", dataUserId))
    return await getUserMembershipsDetailed(dataUserId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (
  tokenUserId: number,
  userId: number
) => {
  if (!(await can(tokenUserId, Authorizations.READ_SECURE, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const user = await getUser(userId);
  const memberships = await getUserMembershipsDetailed(userId);
  const emails = await getUserEmails(userId);
  const events = await getUserEvents(userId);
  const approvedLocations = await getUserApprovedLocations(userId);
  return { user, memberships, emails, events, approvedLocations };
};
