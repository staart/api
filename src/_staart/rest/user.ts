import {
  accessTokensCreateInput,
  accessTokensUpdateInput,
  identitiesCreateInput,
  membershipsUpdateInput,
  users,
} from "@prisma/client";
import { checkIfDisposableEmail } from "@staart/disposable-email";
import {
  CANNOT_DELETE_SOLE_OWNER,
  CANNOT_UPDATE_SOLE_OWNER,
  EMAIL_CANNOT_DELETE,
  EMAIL_EXISTS,
  INCORRECT_PASSWORD,
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  MEMBERSHIP_NOT_FOUND,
  NOT_ENABLED_2FA,
  RESOURCE_NOT_FOUND,
  USER_NOT_FOUND,
} from "@staart/errors";
import { deleteCustomer } from "@staart/payments";
import { compare, hash, randomString } from "@staart/text";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import {
  ALLOW_DISPOSABLE_EMAILS,
  SERVICE_2FA,
  TOKEN_EXPIRY_API_KEY_MAX,
} from "../../config";
import { can } from "../helpers/authorization";
import { deleteItemFromCache } from "../helpers/cache";
import { ApiKeyResponse, couponCodeJwt } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import {
  paginatedResult,
  prisma,
  queryParamsToSelect,
} from "../helpers/prisma";
import { trackEvent } from "../helpers/tracking";
import { EventType, Templates, UserScopes } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import {
  createBackupCodes,
  createEmail,
  getUserById,
  getUserPrimaryEmail,
  resendEmailVerification,
} from "../services/user.service";
import { deleteGroupForUser } from "./group";

export const getUserFromIdForUser = async (
  userId: string,
  tokenUserId: string,
  queryParams: any
) => {
  if (await can(tokenUserId, UserScopes.READ_USER, "user", userId)) {
    const user = await prisma.users.findOne({
      ...queryParamsToSelect(queryParams),
      where: { id: parseInt(userId) },
    });
    if (user) return user;
    throw new Error(USER_NOT_FOUND);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateUserForUser = async (
  tokenUserId: string,
  updateUserId: string,
  data: users,
  locals: Locals
) => {
  delete data.password;
  if (await can(tokenUserId, UserScopes.UPDATE_USER, "user", updateUserId)) {
    const user = await prisma.users.update({
      data,
      where: { id: parseInt(updateUserId) },
    });
    await deleteItemFromCache(`cache_getUserById_${updateUserId}`);
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_UPDATED,
        data: { id: updateUserId, data },
      },
      locals
    );
    return user;
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
    const user = await getUserById(updateUserId);
    if (user.password) {
      const correctPassword = await compare(oldPassword, user.password);
      if (!correctPassword) throw new Error(INCORRECT_PASSWORD);
    }
    const result = await prisma.users.update({
      data: { password: await hash(newPassword, 8) },
      where: { id: parseInt(updateUserId) },
    });
    await deleteItemFromCache(`cache_getUserById_${updateUserId}`);
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.AUTH_PASSWORD_CHANGED,
        data: { id: updateUserId },
      },
      locals
    );
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteUserForUser = async (
  tokenUserId: string,
  updateUserId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER, "user", updateUserId)) {
    const groupsToDelete = await prisma.groups.findMany({
      select: {
        attributes: true,
      },
      where: {
        memberships: {
          every: { userId: parseInt(updateUserId) },
        },
      },
    });
    for await (const group of groupsToDelete) {
      if (
        typeof group.attributes === "object" &&
        !Array.isArray(group.attributes) &&
        typeof group.attributes?.stripeCustomerId === "string"
      )
        await deleteCustomer(group.attributes?.stripeCustomerId);
    }
    await prisma.groups.deleteMany({
      where: {
        memberships: {
          every: { userId: parseInt(updateUserId) },
        },
      },
    });
    await prisma.emails.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    await prisma.memberships.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    await prisma.approvedLocations.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    const originalUser = await getUserById(updateUserId);
    await prisma.users.delete({ where: { id: parseInt(updateUserId) } });
    await deleteItemFromCache(`cache_getUserById_${originalUser.id}`);
    trackEvent(
      {
        userId: tokenUserId,
        type: EventType.USER_DELETED,
        data: { id: updateUserId },
      },
      locals
    );
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getMembershipsForUser = async (
  tokenUserId: string,
  dataUserId: string,
  queryParams: any
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_MEMBERSHIPS, "user", dataUserId)
  )
    return paginatedResult(
      await prisma.memberships.findMany({
        ...queryParamsToSelect(queryParams),
        where: { userId: parseInt(dataUserId) },
        include: { group: true },
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getAllDataForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (!(await can(tokenUserId, UserScopes.READ_USER, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  return prisma.users.findOne({
    where: { id: parseInt(userId) },
    include: {
      emails: true,
      accessTokens: true,
      approvedLocations: true,
      backupCodes: true,
      identities: true,
      memberships: true,
      sessions: true,
    },
  });
};

export const enable2FAForUser = async (tokenUserId: string, userId: string) => {
  if (!(await can(tokenUserId, UserScopes.ENABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const secret = authenticator.generateSecret();
  await prisma.users.update({
    where: { id: parseInt(userId) },
    data: { twoFactorSecret: secret },
  });
  await deleteItemFromCache(`cache_getUserById_${userId}`);
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
  const secret = (
    await prisma.users.findOne({
      select: { twoFactorSecret: true },
      where: { id: parseInt(userId) },
    })
  )?.twoFactorSecret;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (!authenticator.check(verificationCode.toString(), secret))
    throw new Error(INVALID_2FA_TOKEN);
  const codes = await createBackupCodes(userId, 10);
  await prisma.users.update({
    where: { id: parseInt(userId) },
    data: { twoFactorEnabled: true },
  });
  await deleteItemFromCache(`cache_getUserById_${userId}`);
  return codes;
};

export const disable2FAForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (!(await can(tokenUserId, UserScopes.DISABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  await prisma.backupCodes.deleteMany({ where: { userId: parseInt(userId) } });
  const result = prisma.users.update({
    where: { id: parseInt(userId) },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
  await deleteItemFromCache(`cache_getUserById_${userId}`);
  return result;
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
  await prisma.backupCodes.deleteMany({ where: { userId: parseInt(userId) } });
  return createBackupCodes(userId, 10);
};

export const getUserAccessTokensForUser = async (
  tokenUserId: string,
  userId: string,
  queryParams: any
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return paginatedResult(
      await prisma.accessTokens.findMany({
        where: { userId: parseInt(userId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
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
    return prisma.accessTokens.findOne({
      where: { id: parseInt(accessTokenId) },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessTokenId: string,
  data: accessTokensUpdateInput,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.UPDATE_USER_ACCESS_TOKENS, "user", userId)
  )
    return prisma.accessTokens.update({
      where: { id: parseInt(accessTokenId) },
      data,
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessToken: accessTokensCreateInput,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CREATE_USER_ACCESS_TOKENS, "user", userId)
  ) {
    accessToken.accessToken = randomString({ length: 20 });
    accessToken.expiresAt =
      accessToken.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
    return prisma.accessTokens.create({
      data: { ...accessToken, user: { connect: { id: parseInt(userId) } } },
    });
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
  )
    return prisma.accessTokens.delete({
      where: { id: parseInt(accessTokenId) },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionsForUser = async (
  tokenUserId: string,
  userId: string,
  queryParams: any
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return paginatedResult(
      await prisma.sessions.findMany({
        where: { userId: parseInt(userId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionForUser = async (
  tokenUserId: string,
  userId: string,
  sessionId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return prisma.sessions.findOne({ where: { id: parseInt(sessionId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteSessionForUser = async (
  tokenUserId: string,
  userId: string,
  sessionId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER_SESSION, "user", userId)) {
    return prisma.sessions.delete({ where: { id: parseInt(sessionId) } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserIdentitiesForUser = async (
  tokenUserId: string,
  userId: string,
  queryParams: any
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return paginatedResult(
      await prisma.identities.findMany({
        where: { userId: parseInt(userId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identity: identitiesCreateInput
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    return prisma.identities.create({
      data: { ...identity, user: { connect: { id: parseInt(userId) } } },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};
export const connectUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  service: string,
  url: string
) => {
  if (await can(tokenUserId, UserScopes.CREATE_USER_IDENTITY, "user", userId))
    // return createIdentityConnect(userId, service, url);
    throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identityId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return prisma.identities.findOne({ where: { id: parseInt(identityId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteIdentityForUser = async (
  tokenUserId: string,
  userId: string,
  identityId: string,
  locals: Locals
) => {
  if (await can(tokenUserId, UserScopes.DELETE_USER_IDENTITY, "user", userId)) {
    return prisma.identities.delete({ where: { id: parseInt(identityId) } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const addInvitationCredits = async (
  invitedBy: string,
  newUserId: string
) => {
  // const invitedByUserId = (
  //   await prisma.users.findOne({
  //     select: { username: true },
  //     where: { id: parseInt(invitedBy) },
  //   })
  // )?.username;
  // if (!invitedByUserId) return;
  // const invitedByDetails = await getUserById(invitedByUserId);
  // if (!invitedByDetails) return;
  // const invitedByEmail = await getUserPrimaryEmail(invitedByUserId);
  // const newUserEmail = await getUserBestEmail(newUserId);
  // const newUserDetails = await getUserById(newUserId);
  // if (!newUserDetails) return;
  // const emailData = {
  //   invitedByName: invitedByDetails.name,
  //   invitedByCode: await couponCodeJwt(
  //     500,
  //     "usd",
  //     `Invite credits from ${newUserDetails.name}`
  //   ),
  //   newUserName: newUserDetails.name,
  //   newUserCode: await couponCodeJwt(
  //     500,
  //     "usd",
  //     `Invite credits from ${invitedByDetails.name}`
  //   ),
  // };
  // await mail(invitedByEmail.email, Templates.CREDITS_INVITED_BY, emailData);
  // await mail(newUserEmail.email, Templates.CREDITS_NEW_USER, emailData);
};

export const getAllEmailsForUser = async (
  tokenUserId: string,
  userId: string,
  queryParams: any
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_EMAILS, "user", userId)) {
    return paginatedResult(
      await prisma.emails.findMany({
        where: { userId: parseInt(userId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getEmailForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_EMAILS, "user", userId))
    return prisma.emails.findOne({ where: { id: parseInt(emailId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const resendEmailVerificationForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string
) => {
  if (
    await can(
      tokenUserId,
      UserScopes.RESEND_USER_EMAIL_VERIFICATION,
      "user",
      userId
    )
  )
    return resendEmailVerification(emailId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const addEmailToUserForUser = async (
  tokenUserId: string,
  userId: string,
  email: string,
  locals: Locals
) => {
  if (!(await can(tokenUserId, UserScopes.CREATE_USER_EMAILS, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  if (!ALLOW_DISPOSABLE_EMAILS) checkIfDisposableEmail(email);
  const emailExistsAlready =
    (await prisma.emails.findMany({ where: { email } })).length !== 0;
  if (emailExistsAlready) throw new Error(EMAIL_EXISTS);
  const result = await createEmail(parseInt(userId), email, true);
  trackEvent(
    { userId, type: EventType.EMAIL_CREATED, data: { email } },
    locals
  );
  return result;
};

export const deleteEmailFromUserForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string,
  locals: Locals
) => {
  if (!(await can(tokenUserId, UserScopes.DELETE_USER_EMAILS, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const email = await prisma.emails.findOne({
    where: { id: parseInt(emailId) },
  });
  if (!email) throw new Error(RESOURCE_NOT_FOUND);
  if (email.userId !== parseInt(userId))
    throw new Error(INSUFFICIENT_PERMISSION);
  const verifiedEmails = await prisma.emails.findMany({
    where: { id: parseInt(emailId) },
  });
  if (verifiedEmails.length === 1 && email.isVerified)
    throw new Error(EMAIL_CANNOT_DELETE);
  const currentPrimaryEmailId = (await getUserPrimaryEmail(userId)).id;
  if (currentPrimaryEmailId === parseInt(emailId)) {
    const nextVerifiedEmail = verifiedEmails.filter(
      (emailObject) => emailObject.id !== parseInt(emailId)
    )[0];
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: { prefersEmail: { connect: { id: nextVerifiedEmail.id } } },
    });
    await deleteItemFromCache(`cache_getUserById_${userId}`);
  }
  const result = await prisma.emails.delete({
    where: { id: parseInt(emailId) },
  });
  trackEvent(
    { userId, type: EventType.EMAIL_DELETED, data: { email: email.email } },
    locals
  );
  return result;
};

export const getMembershipDetailsForUser = async (
  userId: string,
  membershipId: string
) => {
  if (
    await can(
      userId,
      UserScopes.READ_USER_MEMBERSHIPS,
      "membership",
      membershipId
    )
  )
    return prisma.memberships.findOne({
      where: { id: parseInt(membershipId) },
      include: { user: true, group: true },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteMembershipForUser = async (
  tokenUserId: string | ApiKeyResponse,
  membershipId: string,
  locals: Locals
) => {
  const membership = await prisma.memberships.findOne({
    where: { id: parseInt(membershipId) },
  });
  if (!membership) throw new Error(MEMBERSHIP_NOT_FOUND);
  if (
    await can(
      tokenUserId,
      UserScopes.DELETE_USER_MEMBERSHIPS,
      "membership",
      membership
    )
  ) {
    const groupMembers = await prisma.memberships.findMany({
      where: { groupId: membership.groupId },
    });
    if (groupMembers.length === 1)
      return deleteGroupForUser(
        tokenUserId,
        String(membership.groupId),
        locals
      );
    if (membership.role === "OWNER") {
      const currentMembers = groupMembers.filter(
        (member) => member.role === "OWNER"
      );
      if (currentMembers.length < 2) throw new Error(CANNOT_DELETE_SOLE_OWNER);
    }
    trackEvent(
      {
        userId: membershipId,
        type: EventType.MEMBERSHIP_DELETED,
      },
      locals
    );
    return await prisma.memberships.delete({ where: { id: membership.id } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateMembershipForUser = async (
  userId: string | ApiKeyResponse,
  membershipId: string,
  data: membershipsUpdateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      UserScopes.UPDATE_USER_MEMBERSHIPS,
      "membership",
      membershipId
    )
  ) {
    const membership = await prisma.memberships.findOne({
      where: { id: parseInt(membershipId) },
    });
    if (!membership) throw new Error(MEMBERSHIP_NOT_FOUND);
    if (data.role !== membership.role) {
      if (membership.role === "OWNER") {
        const groupMembers = await prisma.memberships.findMany({
          where: { groupId: membership.groupId },
        });
        const currentMembers = groupMembers.filter(
          (member) => member.role === "OWNER"
        );
        if (currentMembers.length < 2)
          throw new Error(CANNOT_UPDATE_SOLE_OWNER);
      }
    }
    trackEvent(
      {
        userId: membershipId,
        type: EventType.MEMBERSHIP_UPDATED,
      },
      locals
    );
    return prisma.memberships.update({
      where: { id: parseInt(membershipId) },
      data,
    });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
