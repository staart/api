import {
  EMAIL_EXISTS,
  MISSING_PRIMARY_EMAIL,
  USER_NOT_FOUND
} from "@staart/errors";
import { emailVerificationToken } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import {
  addIsPrimaryToEmail,
  addIsPrimaryToEmails,
  query,
  removeReadOnlyValues,
  setValues,
  tableName,
  tableValues
} from "../helpers/mysql";
import { Templates } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { InsertResult } from "../interfaces/mysql";
import { Email } from "../interfaces/tables/emails";
import { User } from "../interfaces/tables/user";
import { sendNewPassword } from "../rest/auth";
import { getUser } from "./user";

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
  const result = (await query(
    `INSERT INTO ${tableName("emails")} ${tableValues(email)}`,
    Object.values(email)
  )) as InsertResult;
  if (sendVerification) {
    await sendEmailVerification(
      result.insertId,
      email.email,
      await getUser(email.userId)
    );
  }
  if (sendPasswordSet) {
    await sendNewPassword(email.userId, email.email);
  }
  return result;
};

/**
 * Send an email verification link
 */
export const sendEmailVerification = async (
  id: string,
  email: string,
  user: User
) => {
  const token = await emailVerificationToken(id);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  return;
};

/**
 * Resend an email verification link
 */
export const resendEmailVerification = async (id: string) => {
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
export const updateEmail = async (id: string, email: KeyValue) => {
  email.updatedAt = new Date();
  email = removeReadOnlyValues(email);
  return query(
    `UPDATE ${tableName("emails")} SET ${setValues(email)} WHERE id = ?`,
    [...Object.values(email), id]
  );
};

/**
 * Delete a user's email
 */
export const deleteEmail = async (id: string) => {
  return query(`DELETE FROM ${tableName("emails")} WHERE id = ?`, [id]);
};

/**
 * Delete a user's email
 */
export const deleteAllUserEmails = async (userId: string) => {
  const allEmails = await getUserEmails(userId);
  allEmails.forEach(email => {
    if (email.id && email.email) {
    }
  });
  return query(`DELETE FROM ${tableName("emails")} WHERE userId = ?`, [userId]);
};

/**
 * Get details about a user's email
 */
export const getEmail = async (id: string) => {
  return ((await query(
    `SELECT * FROM ${tableName("emails")} WHERE id = ? LIMIT 1`,
    [id]
  )) as Array<Email>)[0];
};

/**
 * Get a user's primary email's detailed object
 */
export const getUserPrimaryEmailObject = async (user: User | string) => {
  let userObject: User;
  if (typeof user === "string") {
    userObject = await getUser(user);
  } else {
    userObject = user;
  }
  const primaryEmailId = userObject.primaryEmail;
  if (!primaryEmailId) throw new Error(MISSING_PRIMARY_EMAIL);
  const email = await getEmail(primaryEmailId);
  email.isPrimary = true;
  return email;
};

/**
 * Get a user's primary email
 */
export const getUserPrimaryEmail = async (user: User | string) => {
  return (await getUserPrimaryEmailObject(user)).email;
};

/**
 * Get a list of all emails added by a user
 */
export const getUserEmails = async (userId: string) => {
  return addIsPrimaryToEmails(
    (await query(`SELECT * FROM ${tableName("emails")} WHERE userId = ?`, [
      userId
    ])) as Array<Email>
  );
};

/**
 * Gets the best email to get in touch with a user
 */
export const getUserBestEmail = async (userId: string) => {
  try {
    return await getUserPrimaryEmail(userId);
  } catch (error) {}
  return ((await query(
    `SELECT * FROM ${tableName(
      "emails"
    )} WHERE userId = ? ORDER BY isVerified DESC LIMIT 1`,
    [userId]
  )) as Array<Email>)[0].email;
};

/**
 * Get the detailed email object from an email
 */
export const getEmailObject = async (email: string) => {
  return addIsPrimaryToEmail(
    ((await query(
      `SELECT * FROM ${tableName("emails")} WHERE email = ? LIMIT 1`,
      [email]
    )) as Array<Email>)[0]
  );
};

/**
 * Get the detailed email object from a verified email
 */
export const getVerifiedEmailObject = async (email: string) => {
  return ((await query(
    `SELECT * FROM ${tableName(
      "emails"
    )} WHERE email = ? AND isVerified = 1 LIMIT 1`,
    [email]
  )) as Array<Email>)[0];
};

/**
 * Get a list of all verified emails of a user
 */
export const getUserVerifiedEmails = async (user: User | string) => {
  let userId = "";
  if (typeof user === "object" && user.id) {
    userId = user.id;
  } else if (typeof user === "string") {
    userId = user;
  }
  if (!userId) throw new Error(USER_NOT_FOUND);
  return addIsPrimaryToEmails(
    (await query(
      `SELECT * FROM ${tableName(
        "emails"
      )} WHERE userId = ? AND isVerified = 1`,
      [userId]
    )) as Array<Email>
  );
};

export const checkIfNewEmail = async (email: string) => {
  let hasEmail = true;
  try {
    (await getVerifiedEmailObject(email)).id;
  } catch (error) {
    hasEmail = false;
  }
  if (hasEmail) throw new Error(EMAIL_EXISTS);
  return;
};
