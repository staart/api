import { query, tableValues, setValues } from "../helpers/mysql";
import { User } from "../interfaces/tables/user";
import { capitalizeFirstAndLastLetter } from "../helpers/string";
import { hash } from "bcrypt";

export const listAllUsers = async () => {
  return <User[]>await query("SELECT * from users");
};

export const createUser = async (user: User) => {
  // Clean up values
  user.name = capitalizeFirstAndLastLetter(user.name);
  // Default values for user
  user.nickname = user.nickname || user.name.split(" ")[0];
  user.twoFactorEnabled = user.twoFactorEnabled || false;
  user.timezone = user.timezone || "Europe/Amsterdam";
  user.password = await hash(user.password || "", 8);
  user.notificationEmails = user.notificationEmails || 1;
  user.preferredLanguage = user.preferredLanguage || "en-us";
  user.prefersReducedMotion = user.prefersReducedMotion || false;
  user.createdAt = new Date();
  user.updatedAt = user.createdAt;
  // Create user
  return await query(
    `INSERT INTO users ${tableValues(user)}`,
    Object.values(user)
  );
};

interface KV {
  [index: string]: any;
}
export const updateUser = async (id: number, user: KV) => {
  user.updatedAt = user.createdAt;
  // Create user
  return await query(`UPDATE users SET ${setValues(user)} WHERE id = ?`, [
    ...Object.values(user),
    id
  ]);
};
