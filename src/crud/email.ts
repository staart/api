import { query, tableValues } from "../helpers/mysql";
import { Email } from "../interfaces/tables/emails";

export const createEmail = async (email: Email) => {
  // Clean up values
  email.email = email.email.toLowerCase();
  email.isVerified = false;
  email.isPrimary = false;
  email.createdAt = new Date();
  email.updatedAt = email.createdAt;
  // Create user
  return await query(
    `INSERT INTO emails ${tableValues(email)}`,
    Object.values(email)
  );
};
