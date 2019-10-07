import { EventType, UserScopes } from "../interfaces/enum";
import {
  getUser,
  updateUser,
  getUserApprovedLocations,
  deleteUser,
  deleteAllUserApprovedLocations,
  createBackupCodes,
  deleteUserBackupCodes,
  getUserBackupCodes,
  getUserAccessTokens,
  getAccessToken,
  updateAccessToken,
  createAccessToken,
  deleteAccessToken,
  getUserSessions,
  getSession,
  deleteSession,
  getUserIdentities,
  getIdentity,
  deleteIdentity,
  createIdentityGetOAuthLink,
  createIdentityConnect
} from "../crud/user";
import {
  deleteAllUserMemberships,
  getUserMembershipsDetailed,
  addOrganizationToMemberships
} from "../crud/membership";
import {
  INSUFFICIENT_PERMISSION,
  MISSING_PASSWORD,
  INCORRECT_PASSWORD,
  NOT_ENABLED_2FA,
  INVALID_2FA_TOKEN
} from "@staart/errors";
import { User } from "../interfaces/tables/user";
import { Locals, KeyValue } from "../interfaces/general";
import { getUserEmails, deleteAllUserEmails } from "../crud/email";
import { can } from "../helpers/authorization";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { SERVICE_2FA } from "../config";
import { compare } from "bcryptjs";
import { getPaginatedData } from "../crud/data";
import { addLocationToEvents } from "../helpers/location";
import { trackEvent } from "../helpers/tracking";

export const getUserFromId = async (userId: string, tokenUserId: string) => {
  if (await can(tokenUserId, UserScopes.READ_USER, "user", userId))
    return getUser(userId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateUserForUser = async (
  tokenUserId: string,
  updateUserId: string,
  data: User,
  locals: Locals
) => {
  delete data.password;
  if (await can(tokenUserId, UserScopes.UPDATE_USER, "user", updateUserId)) {
    await updateUser(updateUserId, data);
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_UPDATED,
        data: { id: updateUserId, data }
      },
      locals
    );
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updatePasswordForUser = async (
  tokenUserId: string,
  updateUserId: string,
  oldPassword: string,
  newPassword: string,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CHANGE_PASSWORD, "user", updateUserId)
  ) {
    const user = await getUser(updateUserId, true);
    if (!user.password) throw new Error(MISSING_PASSWORD);
    const correctPassword = await compare(oldPassword, user.password);
    if (!correctPassword) throw new Error(INCORRECT_PASSWORD);
    await updateUser(updateUserId, { password: newPassword });
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.AUTH_PASSWORD_CHANGED,
        data: { id: updateUserId }
      },
      locals
    );
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteUserForUser = async (
  tokenUserId: string,
  updateUserId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER, "user", updateUserId)) {
    await deleteAllUserEmails(updateUserId);
    await deleteAllUserMemberships(updateUserId);
    await deleteAllUserApprovedLocations(updateUserId);
    await deleteUser(updateUserId);
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_DELETED,
        data: { id: updateUserId }
      },
      locals
    );
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getRecentEventsForUser = async (
  tokenUserId: string,
  dataUserId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.READ_USER, "user", dataUserId)) {
    const events = await getPaginatedData({
      table: "events",
      conditions: { userId: dataUserId },
      ...query
    });
    events.data = await addLocationToEvents(events.data);
    return events;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getMembershipsForUser = async (
  tokenUserId: string,
  dataUserId: string,
  query: KeyValue
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_MEMBERSHIPS, "user", dataUserId)
  ) {
    const memberships = await getPaginatedData({
      table: "memberships",
      conditions: { userId: dataUserId },
      ...query
    });
    memberships.data = await addOrganizationToMemberships(memberships.data);
    return memberships;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (
  tokenUserId: string,
  userId: string
) => {
  // Rethink this permission
  if (!(await can(tokenUserId, UserScopes.READ_USER, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const user = await getUser(userId);
  const memberships = await getUserMembershipsDetailed(userId);
  const emails = await getUserEmails(userId);
  const approvedLocations = await getUserApprovedLocations(userId);
  return { user, memberships, emails, approvedLocations };
};

export const enable2FAForUser = async (tokenUserId: string, userId: string) => {
  if (!(await can(tokenUserId, UserScopes.ENABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const secret = authenticator.generateSecret();
  await updateUser(userId, { twoFactorSecret: secret });
  const authPath = authenticator.keyuri(`user-${userId}`, SERVICE_2FA, secret);
  const qrCode = await toDataURL(authPath);
  return { qrCode };
};

export const verify2FAForUser = async (
  tokenUserId: string,
  userId: string,
  verificationCode: number
) => {
  if (!(await can(tokenUserId, UserScopes.ENABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const secret = (await getUser(userId, true)).twoFactorSecret as string;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (!authenticator.check(verificationCode.toString(), secret))
    throw new Error(INVALID_2FA_TOKEN);
  await createBackupCodes(userId, 10);
  await updateUser(userId, { twoFactorEnabled: true });
};

export const disable2FAForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (!(await can(tokenUserId, UserScopes.DISABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  await deleteUserBackupCodes(userId);
  await updateUser(userId, { twoFactorEnabled: false, twoFactorSecret: "" });
};

export const getBackupCodesForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (
    !(await can(tokenUserId, UserScopes.READ_USER_BACKUP_CODES, "user", userId))
  )
    throw new Error(INSUFFICIENT_PERMISSION);
  return await getUserBackupCodes(userId);
};

export const regenerateBackupCodesForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (
    !(await can(
      tokenUserId,
      UserScopes.REGENERATE_USER_BACKUP_CODES,
      "user",
      userId
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);
  await deleteUserBackupCodes(userId);
  await createBackupCodes(userId, 10);
  return await getUserBackupCodes(userId);
};

export const getUserAccessTokensForUser = async (
  tokenUserId: string,
  userId: string,
  query: KeyValue
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return await getUserAccessTokens(userId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessTokenId: string
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return await getAccessToken(userId, accessTokenId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessTokenId: string,
  data: KeyValue,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.UPDATE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    await updateAccessToken(userId, accessTokenId, data);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessToken: KeyValue,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CREATE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    const key = await createAccessToken({ userId, ...accessToken });
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessTokenId: string,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.DELETE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    await deleteAccessToken(userId, accessTokenId);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionsForUser = async (
  tokenUserId: string,
  userId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return await getUserSessions(userId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionForUser = async (
  tokenUserId: string,
  userId: string,
  sessionId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return await getSession(userId, sessionId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteSessionForUser = async (
  tokenUserId: string,
  userId: string,
  sessionId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER_SESSION, "user", userId)) {
    await deleteSession(userId, sessionId);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserIdentitiesForUser = async (
  tokenUserId: string,
  userId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return await getUserIdentities(userId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  body: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    return await createIdentityGetOAuthLink(userId, body);
  throw new Error(INSUFFICIENT_PERMISSION);
};
export const connectUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  service: string,
  code: string
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    return await createIdentityConnect(userId, service, code);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identityId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return await getIdentity(userId, identityId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identityId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER_IDENTITY, "user", userId)) {
    await deleteIdentity(userId, identityId);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
