import { User } from "../interfaces/tables/user";
import { createUser, updateUser } from "../crud/user";
import { InsertResult } from "../interfaces/mysql";
import { createEmail } from "../crud/email";
import { mail } from "../helpers/mail";
import { emailVerificationToken } from "../helpers/jwt";

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
      email,
      isPrimary: true
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
  const token = emailVerificationToken(id);
  await mail(email, "verify-email", { name: user.name, email, token });
  return;
};
