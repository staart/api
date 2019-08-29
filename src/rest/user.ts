import { ErrorCode, EventType, UserScopes } from "../interfaces/enum";
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
  deleteSession
} from "../crud/user";
import {
  deleteAllUserMemberships,
  getUserMembershipsDetailed,
  addOrganizationToMemberships
} from "../crud/membership";
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

export const getUserFromId = async (userId: number, tokenUserId: number) => {
  if (await can(tokenUserId, UserScopes.READ_USER, "user", userId))
    return getUser(userId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateUserForUser = async (
  tokenUserId: number,
  updateUserId: number,
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updatePasswordForUser = async (
  tokenUserId: number,
  updateUserId: number,
  oldPassword: string,
  newPassword: string,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CHANGE_PASSWORD, "user", updateUserId)
  ) {
    const user = await getUser(updateUserId, true);
    if (!user.password) throw new Error(ErrorCode.MISSING_PASSWORD);
    const correctPassword = await compare(oldPassword, user.password);
    if (!correctPassword) throw new Error(ErrorCode.INCORRECT_PASSWORD);
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteUserForUser = async (
  tokenUserId: number,
  updateUserId: number,
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getRecentEventsForUser = async (
  tokenUserId: number,
  dataUserId: number,
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getMembershipsForUser = async (
  tokenUserId: number,
  dataUserId: number,
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (
  tokenUserId: number,
  userId: number
) => {
  // Rethink this permission
  if (!(await can(tokenUserId, UserScopes.READ_USER, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const user = await getUser(userId);
  const memberships = await getUserMembershipsDetailed(userId);
  const emails = await getUserEmails(userId);
  const approvedLocations = await getUserApprovedLocations(userId);
  return { user, memberships, emails, approvedLocations };
};

export const enable2FAForUser = async (tokenUserId: number, userId: number) => {
  if (!(await can(tokenUserId, UserScopes.ENABLE_USER_2FA, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const secret = authenticator.generateSecret();
  await updateUser(userId, { twoFactorSecret: secret });
  const authPath = authenticator.keyuri(`user-${userId}`, SERVICE_2FA, secret);
  const qrCode = await toDataURL(authPath);
  return { qrCode };
};

export const verify2FAForUser = async (
  tokenUserId: number,
  userId: number,
  verificationCode: number
) => {
  if (!(await can(tokenUserId, UserScopes.ENABLE_USER_2FA, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const secret = (await getUser(userId, true)).twoFactorSecret as string;
  if (!secret) throw new Error(ErrorCode.NOT_ENABLED_2FA);
  if (!authenticator.check(verificationCode.toString(), secret))
    throw new Error(ErrorCode.INVALID_2FA_TOKEN);
  await createBackupCodes(userId, 10);
  await updateUser(userId, { twoFactorEnabled: true });
};

export const disable2FAForUser = async (
  tokenUserId: number,
  userId: number
) => {
  if (!(await can(tokenUserId, UserScopes.DISABLE_USER_2FA, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  await deleteUserBackupCodes(userId);
  await updateUser(userId, { twoFactorEnabled: false, twoFactorSecret: "" });
};

export const getBackupCodesForUser = async (
  tokenUserId: number,
  userId: number
) => {
  if (
    !(await can(tokenUserId, UserScopes.READ_USER_BACKUP_CODES, "user", userId))
  )
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  return await getUserBackupCodes(userId);
};

export const regenerateBackupCodesForUser = async (
  tokenUserId: number,
  userId: number
) => {
  if (
    !(await can(
      tokenUserId,
      UserScopes.REGENERATE_USER_BACKUP_CODES,
      "user",
      userId
    ))
  )
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  await deleteUserBackupCodes(userId);
  await createBackupCodes(userId, 10);
  return await getUserBackupCodes(userId);
};

export const getUserAccessTokensForUser = async (
  tokenUserId: number,
  userId: number,
  query: KeyValue
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return await getUserAccessTokens(userId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getUserAccessTokenForUser = async (
  tokenUserId: number,
  userId: number,
  accessTokenId: number
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return await getAccessToken(userId, accessTokenId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateAccessTokenForUser = async (
  tokenUserId: number,
  userId: number,
  accessTokenId: number,
  data: KeyValue,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.UPDATE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    await updateAccessToken(userId, accessTokenId, data);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createAccessTokenForUser = async (
  tokenUserId: number,
  userId: number,
  accessToken: KeyValue,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CREATE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    const key = await createAccessToken({ userId, ...accessToken });
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteAccessTokenForUser = async (
  tokenUserId: number,
  userId: number,
  accessTokenId: number,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.DELETE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    await deleteAccessToken(userId, accessTokenId);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getUserSessionsForUser = async (
  tokenUserId: number,
  userId: number,
  query: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return await getUserSessions(userId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getUserSessionForUser = async (
  tokenUserId: number,
  userId: number,
  sessionId: number
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return await getSession(userId, sessionId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteSessionForUser = async (
  tokenUserId: number,
  userId: number,
  sessionId: number,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER_SESSION, "user", userId)) {
    await deleteSession(userId, sessionId);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
