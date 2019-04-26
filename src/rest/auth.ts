import { User } from "../interfaces/tables/user";
import { createUser, updateUser, getUserByEmail } from "../crud/user";
import { InsertResult } from "../interfaces/mysql";
import { createEmail, updateEmail, getEmail } from "../crud/email";
import { mail } from "../helpers/mail";
import {
  emailVerificationToken,
  verifyToken,
  loginToken
} from "../helpers/jwt";
import { KeyValue, Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import { EventType } from "../interfaces/enum";
import { compare } from "bcrypt";
import { deleteSensitiveInfoUser } from "../helpers/utils";

export const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email, true);
  if (!user.password) throw new Error("unset");
  const correctPassword = await compare(password, user.password);
  if (correctPassword) {
    return await loginToken(deleteSensitiveInfoUser(user));
  }
  throw new Error("invalid auth");
};

export const register = async (
  user: User,
  email?: string,
  organizationId?: string
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
