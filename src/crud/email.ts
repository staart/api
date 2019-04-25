import { query, tableValues, setValues } from "../helpers/mysql";
import { Email } from "../interfaces/tables/emails";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";

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

export const getEmail = async (id: number) => {
  return (<Email[]>await query("SELECT * FROM emails WHERE id = ?", [id]))[0];
};
