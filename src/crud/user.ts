import { query, tableValues, setValues } from "../helpers/mysql";
import { User } from "../interfaces/tables/user";
import {
  capitalizeFirstAndLastLetter,
  dateToDateTime,
  deleteSensitiveInfoUser
} from "../helpers/utils";
import { hash } from "bcrypt";
import { KeyValue } from "../interfaces/general";
import { ErrorCode } from "../interfaces/enum";
import { getEmail, getEmailObject } from "./email";

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

export const getUser = async (id: number, secureOrigin = false) => {
  const users = <User[]>(
    await query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id])
  );
  let user = users[0];
  if (!user) throw new Error(ErrorCode.USER_NOT_FOUND);
  if (!secureOrigin) user = deleteSensitiveInfoUser(user);
  return user;
};

export const getUserByEmail = async (email: string, secureOrigin = false) => {
  const emailObject = await getEmailObject(email);
  return await getUser(emailObject.userId, secureOrigin);
};

export const updateUser = async (id: number, user: KeyValue) => {
  user.updatedAt = dateToDateTime(new Date());
  return await query(`UPDATE users SET ${setValues(user)} WHERE id = ?`, [
    ...Object.values(user),
    id
  ]);
};

export const deleteUser = async (id: number) => {
  return await query("DELETE FROM users WHERE id = ?", [id]);
};
