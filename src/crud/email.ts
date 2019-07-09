import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues,
  addIsPrimaryToEmails,
  addIsPrimaryToEmail
} from "../helpers/mysql";
import { Email } from "../interfaces/tables/emails";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getUser } from "./user";
import { ErrorCode, Templates } from "../interfaces/enum";
import { emailVerificationToken } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { InsertResult } from "../interfaces/mysql";
import { sendNewPassword } from "../rest/auth";
import { hash } from "bcryptjs";

/**
 * Create a new email for a user
 * @param sendVerification  Whether to send an email verification link to new email
 * @param isVerified  Whether this email is verified by default
 */
export const createEmail = async (
  email: Email,
  sendVerification = true,
  sendPasswordSet = false
) => {
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
  if (sendPasswordSet) {
    await sendNewPassword(email.email);
  }
  return result;
};

/**
 * Send an email verification link
 */
export const sendEmailVerification = async (
  id: number,
  email: string,
  user: User
) => {
  const token = await emailVerificationToken(id);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  if (user.password === (await hash("", 8))) await sendNewPassword(email);
  return;
};

/**
 * Resend an email verification link
 */
export const resendEmailVerification = async (id: number) => {
  const token = await emailVerificationToken(id);
  const emailObject = await getEmail(id);
  const email = emailObject.email;
  const user = await getUser(emailObject.userId);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  return;
};

/**
 * Update a user's email details
 */
export const updateEmail = async (id: number, email: KeyValue) => {
  email.updatedAt = dateToDateTime(new Date());
  email = removeReadOnlyValues(email);
  const emailDetails = await getEmail(id);
  return await query(`UPDATE emails SET ${setValues(email)} WHERE id = ?`, [
    ...Object.values(email),
    id
  ]);
};

/**
 * Delete a user's email
 */
export const deleteEmail = async (id: number) => {
  const emailDetails = await getEmail(id);
  return await query("DELETE FROM emails WHERE id = ?", [id]);
};

/**
 * Delete a user's email
 */
export const deleteAllUserEmails = async (userId: number) => {
  const allEmails = await getUserEmails(userId);
  allEmails.forEach(email => {
    if (email.id && email.email) {
    }
  });
  return await query("DELETE FROM emails WHERE userId = ?", [userId]);
};

/**
 * Get details about a user's email
 */
export const getEmail = async (id: number) => {
  return (<Email[]>(
    await query("SELECT * FROM emails WHERE id = ? LIMIT 1", [id])
  ))[0];
};

/**
 * Get a user's primary email's detailed object
 */
export const getUserPrimaryEmailObject = async (user: User | number) => {
  let userObject: User;
  if (typeof user === "number") {
    userObject = await getUser(user);
  } else {
    userObject = user;
  }
  const primaryEmailId = userObject.primaryEmail;
  if (!primaryEmailId) throw new Error(ErrorCode.MISSING_PRIMARY_EMAIL);
  const email = await getEmail(primaryEmailId);
  email.isPrimary = true;
  return email;
};

/**
 * Get a user's primary email
 */
export const getUserPrimaryEmail = async (user: User | number) => {
  return (await getUserPrimaryEmailObject(user)).email;
};

/**
 * Get a list of all emails added by a user
 */
export const getUserEmails = async (userId: number) => {
  return await addIsPrimaryToEmails(<Email[]>(
    await query("SELECT * FROM emails WHERE userId = ?", [userId])
  ));
};

/**
 * Gets the best email to get in touch with a user
 */
export const getUserBestEmail = async (userId: number) => {
  try {
    return await getUserPrimaryEmail(userId);
  } catch (error) {}
  return await (<Email[]>(
    await query(
      "SELECT * FROM emails WHERE userId = ? ORDER BY isVerified DESC LIMIT 1",
      [userId]
    )
  ))[0].email;
};

/**
 * Get the detailed email object from an email
 */
export const getEmailObject = async (email: string) => {
  return await addIsPrimaryToEmail(
    (<Email[]>(
      await query("SELECT * FROM emails WHERE email = ? LIMIT 1", [email])
    ))[0]
  );
};

/**
 * Get the detailed email object from a verified email
 */
export const getVerifiedEmailObject = async (email: string) => {
  return (<Email[]>(
    await query(
      "SELECT * FROM emails WHERE email = ? AND isVerified = 1 LIMIT 1",
      [email]
    )
  ))[0];
};

/**
 * Get a list of all verified emails of a user
 */
export const getUserVerifiedEmails = async (user: User | number) => {
  let userId = 0;
  if (typeof user === "object" && user.id) {
    userId = user.id;
  } else if (typeof user === "number") {
    userId = user;
  }
  if (!userId) throw new Error(ErrorCode.USER_NOT_FOUND);
  return await addIsPrimaryToEmails(<Email[]>(
    await query("SELECT * FROM emails WHERE userId = ? AND isVerified = 1", [
      userId
    ])
  ));
};

export const checkIfNewEmail = async (email: string) => {
  let hasEmail = true;
  try {
    (await getVerifiedEmailObject(email)).id;
  } catch (error) {
    hasEmail = false;
  }
  if (hasEmail) throw new Error(ErrorCode.EMAIL_EXISTS);
  return;
};
