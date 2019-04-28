import { query, tableValues, setValues, removeReadOnlyValues } from "../helpers/mysql";
import { Email } from "../interfaces/tables/emails";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getUser } from "./user";
import { ErrorCode, Templates } from "../interfaces/enum";
import { emailVerificationToken } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { InsertResult } from "../interfaces/mysql";

export const createEmail = async (email: Email, sendVerification = true) => {
  // Clean up values
  email.email = email.email.toLowerCase();
  email.isVerified = false;
  email.createdAt = new Date();
  email.updatedAt = email.createdAt;
  const result = <InsertResult>(
    await query(
      `INSERT INTO emails ${tableValues(email)}`,
      Object.values(email)
    )
  );
  if (sendVerification) {
    await sendEmailVerification(
      result.insertId,
      email.email,
      await getUser(email.userId)
    );
  }
  return result;
};

export const sendEmailVerification = async (
  id: number,
  email: string,
  user: User
) => {
  const token = await emailVerificationToken(id);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  return;
};

export const updateEmail = async (id: number, email: KeyValue) => {
  email.updatedAt = dateToDateTime(new Date());
  email = removeReadOnlyValues(email);
  return await query(`UPDATE emails SET ${setValues(email)} WHERE id = ?`, [
    ...Object.values(email),
    id
  ]);
};

export const deleteEmail = async (id: number) => {
  return await query("DELETE FROM emails WHERE id = ?", [id]);
};

export const getEmail = async (id: number) => {
  return (<Email[]>(
    await query("SELECT * FROM emails WHERE id = ? LIMIT 1", [id])
  ))[0];
};

export const getUserPrimaryEmailObject = async (user: User | number) => {
  let userObject: User;
  if (typeof user === "number") {
    userObject = await getUser(user);
  } else {
    userObject = user;
  }
  const primaryEmailId = userObject.primaryEmail;
  if (!primaryEmailId) throw new Error(ErrorCode.MISSING_PRIMARY_EMAIL);
  return await getEmail(primaryEmailId);
};

export const getUserPrimaryEmail = async (user: User | number) => {
  return (await getUserPrimaryEmailObject(user)).email;
};

export const getUserEmails = async (userId: number) => {
  return <Email>await query("SELECT * FROM emails WHERE userId = ?", [userId]);
};

export const getEmailObject = async (email: string) => {
  return (<Email[]>(
    await query("SELECT * FROM emails WHERE email = ? LIMIT 1", [email])
  ))[0];
};

export const getUserVerifiedEmails = async (userId: number) => {
  return <Email>(
    await query("SELECT * FROM emails WHERE userId = ? AND isVerified = 1", [
      userId
    ])
  );
};
