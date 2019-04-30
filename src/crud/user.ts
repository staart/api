import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues
} from "../helpers/mysql";
import { User, ApprovedLocation } from "../interfaces/tables/user";
import {
  capitalizeFirstAndLastLetter,
  dateToDateTime,
  deleteSensitiveInfoUser,
  anonymizeIpAddress
} from "../helpers/utils";
import { hash } from "bcrypt";
import { KeyValue } from "../interfaces/general";
import { ErrorCode, NotificationEmails } from "../interfaces/enum";
import { getEmailObject } from "./email";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";

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
  user.notificationEmails =
    user.notificationEmails || NotificationEmails.GENERAL;
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
  let user = (<User[]>(
    await cachedQuery("user", id, `SELECT * FROM users WHERE id = ? LIMIT 1`, [
      id
    ])
  ))[0];
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
  user = removeReadOnlyValues(user);
  deleteItemFromCache("user", id);
  return await query(`UPDATE users SET ${setValues(user)} WHERE id = ?`, [
    ...Object.values(user),
    id
  ]);
};

export const deleteUser = async (id: number) => {
  deleteItemFromCache("user", id);
  return await query("DELETE FROM users WHERE id = ?", [id]);
};

export const addApprovedLocation = async (
  userId: number,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  const subnetLocation: ApprovedLocation = {
    userId,
    subnet,
    createdAt: new Date()
  };
  return await query(
    `INSERT INTO \`approved-locations\` ${tableValues(subnetLocation)}`,
    Object.values(subnetLocation)
  );
};

export const getUserApprovedLocations = async (userId: number) => {
  return await query("SELECT * FROM `approved-locations` WHERE userId = ?", [
    userId
  ]);
};

export const checkApprovedLocation = async (
  userId: number,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  const approvedLocations = <ApprovedLocation[]>(
    await query(
      "SELECT * FROM `approved-locations` WHERE userId = ? AND subnet = ? LIMIT 1",
      [userId, subnet]
    )
  );
  if (!approvedLocations.length) return false;
  return true;
};
