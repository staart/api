import { User } from "../interfaces/tables/user";
import { createUser, updateUser, getUserByEmail, getUser } from "../crud/user";
import { InsertResult } from "../interfaces/mysql";
import {
  createEmail,
  updateEmail,
  getEmail,
  getUserPrimaryEmail
} from "../crud/email";
import { mail } from "../helpers/mail";
import {
  emailVerificationToken,
  verifyToken,
  loginToken,
  passwordResetToken
} from "../helpers/jwt";
import { KeyValue, Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import { EventType, ErrorCode, UserRole } from "../interfaces/enum";
import { compare } from "bcrypt";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { createMembership } from "../crud/membership";

export const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email, true);
  if (!user.password) throw new Error(ErrorCode.MISSING_PASSWORD);
  const correctPassword = await compare(password, user.password);
  if (correctPassword) {
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
      role: UserRole.ADMIN
    });
  }
  return { created: true };
};

export const sendEmailVerification = async (
  id: number,
  email: string,
  user: User
) => {
  const token = await emailVerificationToken(id);
  await mail(email, "email-verify", { name: user.name, email, token });
  return;
};

export const sendPasswordReset = async (email: string) => {
  const user = await getUserByEmail(email);
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const token = await passwordResetToken(user.id);
  return await mail(email, "password-reset", { name: user.name, token });
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
