import { User } from "../interfaces/tables/user";
import { createUser, updateUser, getUserByEmail, getUser } from "../crud/user";
import { InsertResult } from "../interfaces/mysql";
import {
  createEmail,
  updateEmail,
  getEmail,
  sendEmailVerification
} from "../crud/email";
import { mail } from "../helpers/mail";
import { verifyToken, loginToken, passwordResetToken } from "../helpers/jwt";
import { KeyValue, Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import {
  EventType,
  ErrorCode,
  MembershipRole,
  Templates
} from "../interfaces/enum";
import { compare, hash } from "bcrypt";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { createMembership } from "../crud/membership";

export const login = async (
  email: string,
  password: string,
  locals: Locals
) => {
  const user = await getUserByEmail(email, true);
  if (!user.password) throw new Error(ErrorCode.MISSING_PASSWORD);
  const correctPassword = await compare(password, user.password);
  if (correctPassword) {
    await createEvent(
      {
        userId: user.id,
        type: EventType.AUTH_LOGIN,
        data: { strategy: "local" }
      },
      locals
    );
    return await loginToken(deleteSensitiveInfoUser(user));
  }
  throw new Error(ErrorCode.INVALID_LOGIN);
};

export const register = async (
  user: User,
  email?: string,
  organizationId?: number
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
    await sendEmailVerification(emailId, email, user);
  }
  if (organizationId) {
    await createMembership({
      userId,
      organizationId,
      role: MembershipRole.ADMIN
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
  const emailId = (<KeyValue>await verifyToken(token, "email-verify")).id;
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
  const userId = (<KeyValue>await verifyToken(token, "password-reset")).id;
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
