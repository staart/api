import {
  backupCodes,
  MembershipRole,
  users,
  usersCreateInput,
} from "@prisma/client";
import { checkIfDisposableEmail } from "@staart/disposable-email";
import {
  EMAIL_EXISTS,
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  INVALID_LOGIN,
  NOT_ENABLED_2FA,
  RESOURCE_NOT_FOUND,
  USER_NOT_FOUND,
} from "@staart/errors";
import { compare, hash } from "@staart/text";
import { authenticator } from "otplib";
import { ALLOW_DISPOSABLE_EMAILS } from "../../config";
import { can } from "../helpers/authorization";
import { deleteItemFromCache } from "../helpers/cache";
import {
  checkInvalidatedToken,
  getLoginResponse,
  loginLinkToken,
  passwordResetToken,
  postLoginTokens,
  resendEmailVerificationToken,
  TokenResponse,
  verifyToken,
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { prisma } from "../helpers/prisma";
import { trackEvent } from "../helpers/tracking";
import { EventType, Templates, Tokens, UserScopes } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import { getDomainByDomainName } from "../services/group.service";
import {
  addApprovedLocation,
  createEmail,
  createUser,
  getUserByEmail,
  getUserById,
  resendEmailVerification,
} from "../services/user.service";

export const validateRefreshToken = async (
  token: string,
  locals: Locals | any
) => {
  await checkInvalidatedToken(token);
  const data = await verifyToken<{ id: number }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  const user = await getUserById(data.id);
  if (!user) throw new Error(USER_NOT_FOUND);
  return postLoginTokens(user, locals, token);
};

export const invalidateRefreshToken = async (
  token: string,
  locals: Locals | any
) => {
  const data = await verifyToken<{ id: number }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  await prisma.sessions.deleteMany({
    where: { token, userId: data.id },
  });
  return;
};

export const login = async (
  email: string,
  password: string,
  locals: Locals | any
) => {
  let user: users;
  try {
    user = await getUserByEmail(email, true);
  } catch (error) {
    const hasUserWithUnverifiedEmail =
      (await prisma.users.count({
        where: {
          emails: {
            some: {
              email,
              isVerified: false,
            },
          },
        },
      })) !== 0;
    if (hasUserWithUnverifiedEmail) throw new Error("401/unverified-email");
    throw new Error(USER_NOT_FOUND);
  }
  if (!user.password) {
    await mail({
      template: Templates.LOGIN_LINK,
      data: { ...user, token: await loginLinkToken(user) },
      to: email,
    });
    return { success: true, message: "login-link-sent" };
  }
  const isPasswordCorrect = await compare(password, user.password);
  if (isPasswordCorrect)
    return getLoginResponse(user, EventType.AUTH_LOGIN, "local", locals);
  throw new Error(INVALID_LOGIN);
};

export const login2FA = async (
  code: number,
  token: string,
  locals: Locals | any
) => {
  const data = await verifyToken<{ id: number }>(token, Tokens.TWO_FACTOR);
  const user = await getUserById(data.id);
  if (!user) throw new Error(USER_NOT_FOUND);
  const secret = user.twoFactorSecret;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (authenticator.check(code.toString(), secret))
    return postLoginTokens(user, locals);
  const allBackupCodes = await prisma.backupCodes.findMany({
    where: { userId: user.id },
  });
  let usedBackupCode: backupCodes | undefined = undefined;
  for await (const backupCode of allBackupCodes)
    if (await compare(backupCode.code, code.toString()))
      usedBackupCode = backupCode;
  if (usedBackupCode && !usedBackupCode.isUsed) {
    await prisma.backupCodes.update({
      where: { id: usedBackupCode.id },
      data: { isUsed: true },
    });
    return postLoginTokens(user, locals);
  }
  throw new Error(INVALID_2FA_TOKEN);
};

export const register = async (
  user: usersCreateInput,
  locals?: Locals | any,
  email?: string,
  groupId?: number,
  role?: MembershipRole,
  emailVerified = false
) => {
  if (email) {
    const isNewEmail =
      (await prisma.emails.findMany({ where: { email, isVerified: true } }))
        .length === 0;
    if (!isNewEmail) throw new Error(EMAIL_EXISTS);
    if (!ALLOW_DISPOSABLE_EMAILS) checkIfDisposableEmail(email);
  }
  if (!groupId && email) {
    let domain = "";
    try {
      domain = email.split("@")[1];
      const domainDetails = await getDomainByDomainName(domain);
      groupId = domainDetails.groupId;
    } catch (error) {}
  }
  const userId = (
    await createUser({
      ...user,
      ...(groupId
        ? {
            memberships: {
              create: {
                group: {
                  connect: { id: groupId },
                },
                role,
              },
            },
          }
        : {}),
    })
  ).id;
  let resendToken: string | undefined = undefined;
  if (email) {
    const newEmail = await createEmail(userId, email, !emailVerified);
    await prisma.users.update({
      where: { id: userId },
      data: { prefersEmail: { connect: { id: newEmail.id } } },
    });
    await deleteItemFromCache(`cache_getUserById_${userId}`);
    resendToken = await resendEmailVerificationToken(newEmail.id);
  }
  if (locals) await addApprovedLocation(userId, locals.ipAddress);
  return { userId, resendToken };
};

export const sendPasswordReset = async (
  email: string,
  locals?: Locals | any
) => {
  const user = await getUserByEmail(email);
  const token = await passwordResetToken(user.id);
  await mail({
    to: email,
    template: Templates.PASSWORD_RESET,
    data: { name: user.name, token },
  });
  if (locals)
    trackEvent(
      {
        userId: user.id,
        type: EventType.AUTH_PASSWORD_RESET_REQUESTED,
        data: { token },
      },
      locals
    );
  return;
};

export const sendNewPassword = async (userId: number, email: string) => {
  const user = await prisma.users.findOne({
    where: { id: userId },
    include: { emails: true },
  });
  if (!user) throw new Error(USER_NOT_FOUND);
  if (!user.emails.filter((userEmail) => userEmail.email === email).length)
    throw new Error(RESOURCE_NOT_FOUND);
  const token = await passwordResetToken(user.id);
  await mail({
    to: email,
    template: Templates.NEW_PASSWORD,
    data: { name: user.name, token },
  });
  return;
};

export const verifyEmail = async (token: string, locals: Locals | any) => {
  const emailId = (
    await verifyToken<{ id: number }>(token, Tokens.EMAIL_VERIFY)
  ).id;
  const email = await prisma.emails.findOne({
    where: { id: emailId },
  });
  if (!email) throw new Error(RESOURCE_NOT_FOUND);
  trackEvent(
    {
      userId: email.userId,
      type: EventType.EMAIL_VERIFIED,
      data: { id: emailId },
    },
    locals
  );
  return prisma.emails.update({
    where: { id: emailId },
    data: { isVerified: true },
  });
};

export const loginLink = async (token: string, locals: Locals | any) => {
  const userId = (await verifyToken<{ id: number }>(token, Tokens.LOGIN_LINK))
    .id;
  const user = await prisma.users.findOne({
    where: { id: userId },
  });
  if (!user) throw new Error(RESOURCE_NOT_FOUND);
  trackEvent(
    {
      userId,
      type: EventType.AUTH_LOGIN,
      data: { id: userId },
    },
    locals
  );
  return postLoginTokens(user, locals);
};

export const updatePassword = async (
  token: string,
  password: string,
  locals: Locals | any
) => {
  const userId = (
    await verifyToken<{ id: number }>(token, Tokens.PASSWORD_RESET)
  ).id;
  await prisma.users.update({
    where: { id: userId },
    data: { password: await hash(password, 8) },
  });
  await deleteItemFromCache(`cache_getUserById_${userId}`);
  trackEvent(
    {
      userId,
      type: EventType.AUTH_PASSWORD_CHANGED,
    },
    locals
  );
  return;
};

export const impersonate = async (
  tokenUserId: number,
  impersonateUserId: number,
  locals: Locals | any
) => {
  if (
    !(await can(tokenUserId, UserScopes.IMPERSONATE, "user", impersonateUserId))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const user = await getUserById(impersonateUserId);
  if (user)
    return getLoginResponse(user, EventType.AUTH_LOGIN, "impersonate", locals);
  throw new Error(USER_NOT_FOUND);
};

export const approveLocation = async (token: string, locals: Locals | any) => {
  const tokenUser = await verifyToken<TokenResponse>(
    token,
    Tokens.APPROVE_LOCATION
  );
  if (!tokenUser.id) throw new Error(USER_NOT_FOUND);
  const user = await getUserById(tokenUser.id);
  if (!user) throw new Error(USER_NOT_FOUND);
  const ipAddress = tokenUser.ipAddress || locals.ipAddress;
  await addApprovedLocation(user.id, ipAddress);
  trackEvent(
    {
      userId: tokenUser.id,
      type: EventType.AUTH_APPROVE_LOCATION,
    },
    locals
  );
  return getLoginResponse(
    user,
    EventType.AUTH_APPROVE_LOCATION,
    ipAddress,
    locals
  );
};

export const resendEmailVerificationWithToken = async (token: string) => {
  const data = await verifyToken<{ id: number }>(token, Tokens.EMAIL_RESEND);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  return resendEmailVerification(data.id);
};
