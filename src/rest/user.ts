import {
  INCORRECT_PASSWORD,
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  MISSING_PASSWORD,
  NOT_ENABLED_2FA
} from "@staart/errors";
import { compare } from "@staart/text";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { SERVICE_2FA } from "../config";
import { getPaginatedData } from "../crud/data";
import {
  deleteAllUserEmails,
  getUserEmails,
  getUserPrimaryEmail,
  getUserBestEmail
} from "../crud/email";
import {
  addOrganizationToMemberships,
  deleteAllUserMemberships,
  getUserMembershipsDetailed
} from "../crud/membership";
import {
  createAccessToken,
  createBackupCodes,
  createIdentityConnect,
  createIdentityGetOAuthLink,
  deleteAccessToken,
  deleteAllUserApprovedLocations,
  deleteIdentity,
  deleteSession,
  deleteUser,
  deleteUserBackupCodes,
  getAccessToken,
  getIdentity,
  getSession,
  getUser,
  getUserAccessTokens,
  getUserApprovedLocations,
  getUserBackupCodes,
  getUserIdentities,
  getUserSessions,
  updateAccessToken,
  updateUser,
  getUserIdFromUsername
} from "../crud/user";
import { can } from "../helpers/authorization";
import { trackEvent } from "../helpers/tracking";
import { EventType, UserScopes, Templates } from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { Event } from "../interfaces/tables/events";
import { Membership } from "../interfaces/tables/memberships";
import { User } from "../interfaces/tables/user";
import { mail } from "../helpers/mail";
import { couponCodeJwt } from "../helpers/jwt";

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
  if (await can(tokenUserId, UserScopes.READ_USER, "user", dataUserId))
    return await getPaginatedData<Event>({
      table: "events",
      conditions: { userId: dataUserId },
      ...query
    });
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
    const memberships = await getPaginatedData<Membership>({
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
  return getUserBackupCodes(userId);
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
  return getUserBackupCodes(userId);
};

export const getUserAccessTokensForUser = async (
  tokenUserId: string,
  userId: string,
  query: KeyValue
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return getUserAccessTokens(userId, query);
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
    return getAccessToken(userId, accessTokenId);
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
    return getUserSessions(userId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionForUser = async (
  tokenUserId: string,
  userId: string,
  sessionId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return getSession(userId, sessionId);
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
    return getUserIdentities(userId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  body: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    return createIdentityGetOAuthLink(userId, body);
  throw new Error(INSUFFICIENT_PERMISSION);
};
export const connectUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  service: string,
  url: string
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    return createIdentityConnect(userId, service, url);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identityId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return getIdentity(userId, identityId);
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

export const addInvitationCredits = async (
  invitedBy: string,
  newUserId: string
) => {
  let invitedByUserId = "";
  try {
    invitedByUserId = await getUserIdFromUsername(invitedBy);
  } catch (error) {}
  if (!invitedByUserId) return;
  const invitedByDetails = await getUser(invitedByUserId);
  const invitedByEmail = await getUserPrimaryEmail(invitedByUserId);
  const newUserEmail = await getUserBestEmail(newUserId);
  const newUserDetails = await getUser(newUserId);
  const emailData = {
    invitedByName: invitedByDetails.name,
    invitedByCode: await couponCodeJwt(
      500,
      "usd",
      `Invite credits from ${newUserDetails.name}`
    ),
    newUserName: newUserDetails.name,
    newUserCode: await couponCodeJwt(
      500,
      "usd",
      `Invite credits from ${invitedByDetails.name}`
    )
  };
  await mail(invitedByEmail, Templates.CREDITS_INVITED_BY, emailData);
  await mail(newUserEmail, Templates.CREDITS_NEW_USER, emailData);
};
