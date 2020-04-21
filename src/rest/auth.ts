import { checkIfDisposableEmail } from "@staart/disposable-email";
import {
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  INVALID_LOGIN,
  MISSING_PASSWORD,
  NOT_ENABLED_2FA,
  RESOURCE_NOT_FOUND,
  USERNAME_EXISTS,
  USER_NOT_FOUND,
  EMAIL_EXISTS,
} from "@staart/errors";
import { compare, hash } from "@staart/text";
import { authenticator } from "otplib";
import { ALLOW_DISPOSABLE_EMAILS } from "../config";
import { can } from "../helpers/authorization";
import {
  checkInvalidatedToken,
  getLoginResponse,
  passwordResetToken,
  postLoginTokens,
  TokenResponse,
  verifyToken,
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { trackEvent } from "../helpers/tracking";
import { EventType, Templates, Tokens, UserScopes } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import {
  getUserByEmail,
  checkUserUsernameAvailability,
  getBestUsernameForUser,
  createUser,
  addApprovedLocation,
  getUserById,
  createEmail,
} from "../services/user.service";
import {
  usersCreateInput,
  MembershipRole,
  users,
  backup_codes,
} from "@prisma/client";
import { getDomainByDomainName } from "../services/organization.service";
import { PartialBy } from "../helpers/utils";

export const validateRefreshToken = async (token: string, locals: Locals) => {
  await checkInvalidatedToken(token);
  const data = await verifyToken<{ id: string }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  const user = await getUserById(data.id);
  if (!user) throw new Error(USER_NOT_FOUND);
  return postLoginTokens(user, locals, token);
};

export const invalidateRefreshToken = async (token: string, locals: Locals) => {
  const data = await verifyToken<{ id: string }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  await prisma.sessions.deleteMany({
    where: { jwtToken: token, userId: parseInt(data.id) },
  });
  return;
};

export const login = async (
  email: string,
  password: string,
  locals: Locals
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
  if (!user.password) throw new Error(MISSING_PASSWORD);
  const isPasswordCorrect = await compare(password, user.password);
  if (isPasswordCorrect)
    return getLoginResponse(user, EventType.AUTH_LOGIN, "local", locals);
  throw new Error(INVALID_LOGIN);
};

export const login2FA = async (code: number, token: string, locals: Locals) => {
  const data = await verifyToken<{ id: string }>(token, Tokens.TWO_FACTOR);
  const user = await getUserById(data.id);
  if (!user) throw new Error(USER_NOT_FOUND);
  const secret = user.twoFactorSecret;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (authenticator.check(code.toString(), secret))
    return postLoginTokens(user, locals);
  const allBackupCodes = await prisma.backup_codes.findMany({
    where: { userId: user.id },
  });
  let usedBackupCode: backup_codes | undefined = undefined;
  for await (const backupCode of allBackupCodes)
    if (await compare(backupCode.code, code.toString()))
      usedBackupCode = backupCode;
  if (usedBackupCode && !usedBackupCode.isUsed) {
    await prisma.backup_codes.update({
      where: { id: usedBackupCode.id },
      data: { isUsed: true },
    });
    return postLoginTokens(user, locals);
  }
  throw new Error(INVALID_2FA_TOKEN);
};

export const register = async (
  _user: PartialBy<PartialBy<usersCreateInput, "nickname">, "username">,
  locals?: Locals,
  email?: string,
  organizationId?: string,
  role?: MembershipRole,
  emailVerified = false
) => {
  const user: usersCreateInput = { username: "", nickname: "", ..._user };
  if (email) {
    const isNewEmail =
      (await prisma.emails.findMany({ where: { email, isVerified: true } }))
        .length === 0;
    if (!isNewEmail) throw new Error(EMAIL_EXISTS);
    if (!ALLOW_DISPOSABLE_EMAILS) checkIfDisposableEmail(email);
  }
  if (user.username && !(await checkUserUsernameAvailability(user.username)))
    throw new Error(USERNAME_EXISTS);
  user.username = user.username || (await getBestUsernameForUser(user.name));
  if (!organizationId && email) {
    let domain = "";
    try {
      domain = email.split("@")[1];
      const domainDetails = await getDomainByDomainName(domain);
      organizationId = domainDetails.organizationId.toString();
    } catch (error) {}
  }
  const userId = (
    await createUser({
      ...user,
      ...(organizationId
        ? {
            memberships: {
              create: {
                organization: {
                  connect: { id: parseInt(organizationId) },
                },
                role,
              },
            },
          }
        : {}),
    })
  ).id;
  if (email) {
    const newEmail = await createEmail(userId, email, !emailVerified);
    await prisma.users.update({
      where: { id: userId },
      data: { primaryEmail: newEmail.id },
    });
  }
  if (locals) await addApprovedLocation(userId, locals.ipAddress);
  return { userId };
};

export const sendPasswordReset = async (email: string, locals?: Locals) => {
  const user = await getUserByEmail(email);
  const token = await passwordResetToken(user.id);
  await mail(email, Templates.PASSWORD_RESET, { name: user.name, token });
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
  await mail(email, Templates.NEW_PASSWORD, { name: user.name, token });
  return;
};

export const verifyEmail = async (token: string, locals: Locals) => {
  const emailId = (
    await verifyToken<{ id: string }>(token, Tokens.EMAIL_VERIFY)
  ).id;
  const email = await prisma.emails.findOne({
    where: { id: parseInt(emailId) },
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
    where: { id: parseInt(emailId) },
    data: { isVerified: true },
  });
};

export const updatePassword = async (
  token: string,
  password: string,
  locals: Locals
) => {
  const userId = (
    await verifyToken<{ id: string }>(token, Tokens.PASSWORD_RESET)
  ).id;
  await prisma.users.update({
    where: { id: parseInt(userId) },
    data: { password: await hash(password, 8) },
  });
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
  tokenUserId: string,
  impersonateUserId: string,
  locals: Locals
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

export const approveLocation = async (token: string, locals: Locals) => {
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
