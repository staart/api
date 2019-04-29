import { User } from "../interfaces/tables/user";
import {
  createUser,
  updateUser,
  getUserByEmail,
  getUser,
  addApprovedLocation
} from "../crud/user";
import { InsertResult } from "../interfaces/mysql";
import { createEmail, updateEmail, getEmail } from "../crud/email";
import { mail } from "../helpers/mail";
import {
  verifyToken,
  loginToken,
  passwordResetToken,
  refreshToken,
  getLoginResponse
} from "../helpers/jwt";
import { KeyValue, Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import {
  EventType,
  ErrorCode,
  MembershipRole,
  Templates,
  Tokens,
  UserRole
} from "../interfaces/enum";
import { compare, hash } from "bcrypt";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { createMembership } from "../crud/membership";
import {
  googleGetConnectionUrl,
  googleGetTokensFromCode,
  googleGetEmailFromToken
} from "../helpers/google";

export const validateRefreshToken = async (token: string, locals: Locals) => {
  const data = <User>await verifyToken(token, Tokens.REFRESH);
  if (!data.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const user = await getUser(data.id);
  return await getLoginResponse(
    user,
    EventType.AUTH_REFRESH,
    "refresh",
    locals
  );
};

export const login = async (
  email: string,
  password: string,
  locals: Locals
) => {
  const user = await getUserByEmail(email, true);
  if (!user.password) throw new Error(ErrorCode.MISSING_PASSWORD);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const correctPassword = await compare(password, user.password);
  if (correctPassword) {
    return await getLoginResponse(user, EventType.AUTH_LOGIN, "local", locals);
  }
  throw new Error(ErrorCode.INVALID_LOGIN);
};

export const register = async (
  user: User,
  email?: string,
  organizationId?: number,
  role?: MembershipRole
) => {
  // Create user
  const result = <InsertResult>await createUser(user);
  const userId = result.insertId;
  // Set email
  if (email) {
    const newEmail = <InsertResult>await createEmail({
      userId,
      email
    });
    const emailId = newEmail.insertId;
    await updateUser(userId, { primaryEmail: emailId });
  }
  if (organizationId && role) {
    await createMembership({
      userId,
      organizationId,
      role
    });
  }
  return { created: true };
};

export const sendPasswordReset = async (email: string, locals: Locals) => {
  const user = await getUserByEmail(email);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const token = await passwordResetToken(user.id);
  await mail(email, Templates.PASSWORD_RESET, { name: user.name, token });
  await createEvent(
    {
      userId: user.id,
      type: EventType.AUTH_PASSWORD_RESET_REQUESTED,
      data: { token }
    },
    locals
  );
  return;
};

export const verifyEmail = async (token: string, locals: Locals) => {
  const emailId = (<KeyValue>await verifyToken(token, Tokens.EMAIL_VERIFY)).id;
  const email = await getEmail(emailId);
  await createEvent(
    {
      userId: email.userId,
      type: EventType.EMAIL_VERIFIED,
      data: { id: emailId }
    },
    locals
  );
  return await updateEmail(emailId, { isVerified: true });
};

export const updatePassword = async (
  token: string,
  password: string,
  locals: Locals
) => {
  const userId = (<KeyValue>await verifyToken(token, Tokens.PASSWORD_RESET)).id;
  const hashedPassword = await hash(password || "", 8);
  await updateUser(userId, { password: hashedPassword });
  await createEvent(
    {
      userId,
      type: EventType.AUTH_PASSWORD_CHANGED
    },
    locals
  );
  return;
};

export const loginWithGoogleLink = () => googleGetConnectionUrl();

export const loginWithGoogleVerify = async (code: string, locals: Locals) => {
  const data = await googleGetTokensFromCode(code);
  const email = await googleGetEmailFromToken(data);
  const user = await getUserByEmail(email);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  return await getLoginResponse(user, EventType.AUTH_LOGIN, "google", locals);
};

export const impersonate = async (
  tokenUserId: number,
  impersonateUserId: number
) => {
  const tokenUser = await getUser(tokenUserId);
  if (tokenUser.role != UserRole.ADMIN)
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const user = await getUser(impersonateUserId);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  return {
    token: await loginToken(deleteSensitiveInfoUser(user)),
    refresh: await refreshToken(user.id)
  };
};

export const approveLocation = async (token: string, locals: Locals) => {
  const tokenUser = <User>await verifyToken(token, Tokens.APPROVE_LOCATION);
  if (!tokenUser.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const user = await getUser(tokenUser.id);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  await addApprovedLocation(user.id, locals.ipAddress);
  return await getLoginResponse(
    user,
    EventType.AUTH_APPROVE_LOCATION,
    locals.ipAddress,
    locals
  );
};
