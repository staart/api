import { query, tableValues, setValues } from "../helpers/mysql";
import { Email } from "../interfaces/tables/emails";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getUser } from "./user";
import { ErrorCode } from "../interfaces/enum";

export const createEmail = async (email: Email, sendVerification = true) => {
  // Clean up values
  email.email = email.email.toLowerCase();
  email.isVerified = false;
  email.createdAt = new Date();
  email.updatedAt = email.createdAt;
  // Create user
  return await query(
    `INSERT INTO emails ${tableValues(email)}`,
    Object.values(email)
  );
};

export const updateEmail = async (id: number, email: KeyValue) => {
  email.updatedAt = dateToDateTime(new Date());
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
  return <Email>await query("SELECT * FROM emails WHERE email = ?", [email]);
};

export const getUserVerifiedEmails = async (userId: number) => {
  return <Email>(
    await query("SELECT * FROM emails WHERE userId = ? AND isVerified = 1", [
      userId
    ])
  );
};
