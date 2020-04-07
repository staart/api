import {
  INCORRECT_PASSWORD,
  EMAIL_CANNOT_DELETE,
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  MISSING_PASSWORD,
  NOT_ENABLED_2FA,
  USER_NOT_FOUND,
  EMAIL_EXISTS,
  RESOURCE_NOT_FOUND,
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_DELETE_SOLE_OWNER,
  CANNOT_UPDATE_SOLE_OWNER,
  MEMBERSHIP_NOT_FOUND,
} from "@staart/errors";
import { compare } from "@staart/text";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { SERVICE_2FA } from "../config";
import {
  createBackupCodes,
  getUserPrimaryEmail,
  getUserBestEmail,
  resendEmailVerification,
  getUserById,
} from "../services/user.service";
import { can } from "../helpers/authorization";
import { trackEvent } from "../helpers/tracking";
import { EventType, UserScopes, Templates } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import { mail } from "../helpers/mail";
import { couponCodeJwt } from "../helpers/jwt";
import { prisma } from "../helpers/prisma";
import {
  users,
  membershipsSelect,
  membershipsInclude,
  membershipsOrderByInput,
  membershipsWhereUniqueInput,
  access_tokensSelect,
  access_tokensInclude,
  access_tokensOrderByInput,
  access_tokensWhereUniqueInput,
  access_tokensUpdateInput,
  access_tokensCreateInput,
  sessionsSelect,
  sessionsInclude,
  sessionsOrderByInput,
  sessionsWhereUniqueInput,
  identitiesSelect,
  identitiesInclude,
  identitiesOrderByInput,
  identitiesWhereUniqueInput,
  identitiesCreateInput,
  emailsSelect,
  emailsInclude,
  emailsOrderByInput,
  emailsWhereUniqueInput,
  membershipsUpdateInput,
} from "@prisma/client";
import { ALLOW_DISPOSABLE_EMAILS } from "../config";
import { checkIfDisposableEmail } from "@staart/disposable-email";
import { ApiKeyResponse } from "../helpers/jwt";

export const getUserFromIdForUser = async (
  userId: string,
  tokenUserId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER, "user", userId)) {
    const user = await getUserById(userId);
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
    if (!user.password) throw new Error(MISSING_PASSWORD);
    const correctPassword = await compare(oldPassword, user.password);
    if (!correctPassword) throw new Error(INCORRECT_PASSWORD);
    const result = await prisma.users.update({
      data: { password: newPassword },
      where: { id: parseInt(updateUserId) },
    });
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
    await prisma.emails.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    await prisma.memberships.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    await prisma.approved_locations.deleteMany({
      where: { userId: parseInt(updateUserId) },
    });
    await prisma.users.deleteMany({ where: { id: parseInt(updateUserId) } });
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
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: membershipsSelect;
    include?: membershipsInclude;
    orderBy?: membershipsOrderByInput;
    skip?: number;
    after?: membershipsWhereUniqueInput;
    before?: membershipsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_MEMBERSHIPS, "user", dataUserId)
  )
    return prisma.memberships.findMany({
      where: { userId: parseInt(dataUserId) },
      include: { organization: true, ...include },
      select,
      orderBy,
      skip,
      after,
      before,
      first,
      last,
    });
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
      access_tokens: true,
      approved_locations: true,
      backup_codes: true,
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
  // const secret = (await getUser(userId, true)).twoFactorSecret as string;
  const secret = (
    await prisma.users.findOne({
      select: { twoFactorSecret: true },
      where: { id: parseInt(userId) },
    })
  )?.twoFactorSecret;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (!authenticator.check(verificationCode.toString(), secret))
    throw new Error(INVALID_2FA_TOKEN);
  await createBackupCodes(userId, 10);
  return prisma.users.update({
    where: { id: parseInt(userId) },
    data: { twoFactorEnabled: true },
  });
};

export const disable2FAForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (!(await can(tokenUserId, UserScopes.DISABLE_USER_2FA, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  await prisma.backup_codes.deleteMany({ where: { userId: parseInt(userId) } });
  return prisma.users.update({
    where: { id: parseInt(userId) },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
};

export const getBackupCodesForUser = async (
  tokenUserId: string,
  userId: string
) => {
  if (
    !(await can(tokenUserId, UserScopes.READ_USER_BACKUP_CODES, "user", userId))
  )
    throw new Error(INSUFFICIENT_PERMISSION);
  return prisma.backup_codes.findMany({ where: { userId: parseInt(userId) } });
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
  await prisma.backup_codes.deleteMany({ where: { userId: parseInt(userId) } });
  await createBackupCodes(userId, 10);
  return prisma.backup_codes.findMany({ where: { userId: parseInt(userId) } });
};

export const getUserAccessTokensForUser = async (
  tokenUserId: string,
  userId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: access_tokensSelect;
    include?: access_tokensInclude;
    orderBy?: access_tokensOrderByInput;
    skip?: number;
    after?: access_tokensWhereUniqueInput;
    before?: access_tokensWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(tokenUserId, UserScopes.READ_USER_ACCESS_TOKENS, "user", userId)
  )
    return prisma.access_tokens.findMany({
      where: { userId: parseInt(userId) },
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last,
    });
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
    return prisma.access_tokens.findOne({
      where: { id: parseInt(accessTokenId) },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessTokenId: string,
  data: access_tokensUpdateInput,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.UPDATE_USER_ACCESS_TOKENS, "user", userId)
  )
    return prisma.access_tokens.update({
      where: { id: parseInt(accessTokenId) },
      data,
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createAccessTokenForUser = async (
  tokenUserId: string,
  userId: string,
  accessToken: access_tokensCreateInput,
  locals: Locals
) => {
  if (
    await can(tokenUserId, UserScopes.CREATE_USER_ACCESS_TOKENS, "user", userId)
  )
    return prisma.access_tokens.create({
      data: { ...accessToken, user: { connect: { id: parseInt(userId) } } },
    });
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
    return prisma.access_tokens.delete({
      where: { id: parseInt(accessTokenId) },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getUserSessionsForUser = async (
  tokenUserId: string,
  userId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: sessionsSelect;
    include?: sessionsInclude;
    orderBy?: sessionsOrderByInput;
    skip?: number;
    after?: sessionsWhereUniqueInput;
    before?: sessionsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_SESSION, "user", userId))
    return prisma.sessions.findMany({
      where: { userId: parseInt(userId) },
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last,
    });
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
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: identitiesSelect;
    include?: identitiesInclude;
    orderBy?: identitiesOrderByInput;
    skip?: number;
    after?: identitiesWhereUniqueInput;
    before?: identitiesWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_IDENTITY, "user", userId))
    return prisma.sessions.findMany({
      where: { userId: parseInt(userId) },
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last,
    });
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
  const invitedByUserId = (
    await prisma.users.findOne({
      select: { username: true },
      where: { id: parseInt(invitedBy) },
    })
  )?.username;
  if (!invitedByUserId) return;
  const invitedByDetails = await getUserById(invitedByUserId);
  if (!invitedByDetails) return;
  const invitedByEmail = await getUserPrimaryEmail(invitedByUserId);
  const newUserEmail = await getUserBestEmail(newUserId);
  const newUserDetails = await getUserById(newUserId);
  if (!newUserDetails) return;
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
    ),
  };
  await mail(invitedByEmail.email, Templates.CREDITS_INVITED_BY, emailData);
  await mail(newUserEmail.email, Templates.CREDITS_NEW_USER, emailData);
};

export const getAllEmailsForUser = async (
  tokenUserId: string,
  userId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: emailsSelect;
    include?: emailsInclude;
    orderBy?: emailsOrderByInput;
    skip?: number;
    after?: emailsWhereUniqueInput;
    before?: emailsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_EMAILS, "user", userId)) {
    return prisma.emails.findMany({
      where: { userId: parseInt(userId) },
      select,
      include,
      orderBy,
      skip,
      after,
      before,
      first,
      last,
    });
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
  const result = await prisma.emails.create({
    data: { email, user: { connect: { id: parseInt(userId) } } },
  });
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
    where: { id: parseInt(userId) },
  });
  if (!email) throw new Error(RESOURCE_NOT_FOUND);
  if (email.userId !== parseInt(userId))
    throw new Error(INSUFFICIENT_PERMISSION);
  const verifiedEmails = await prisma.emails.findMany({
    where: { id: parseInt(userId) },
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
      data: { primaryEmail: nextVerifiedEmail.id },
    });
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
      include: { user: true, organization: true },
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
    const organizationMembers = await prisma.memberships.findMany({
      where: { organizationId: membership.organizationId },
    });
    if (membership.role === "OWNER") {
      const currentMembers = organizationMembers.filter(
        (member) => member.role === "OWNER"
      );
      if (currentMembers.length < 2) throw new Error(CANNOT_DELETE_SOLE_OWNER);
    }
    if (organizationMembers.length === 1)
      throw new Error(CANNOT_DELETE_SOLE_MEMBER);
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
        const organizationMembers = await prisma.memberships.findMany({
          where: { organizationId: membership.organizationId },
        });
        const currentMembers = organizationMembers.filter(
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
