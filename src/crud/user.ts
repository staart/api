import { normalizeEmail } from "validator";
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
import {
  ErrorCode,
  NotificationEmails,
  CacheCategories
} from "../interfaces/enum";
import { getEmailObject } from "./email";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";

/**
 * Get a list of all users
 */
export const listAllUsers = async () => {
  return <User[]>await query("SELECT * from users");
};

/**
 * Create a new user
 */
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

/**
 * Get the details of a user
 * @param secureOrigin  Whether security keys (password/tokens) should be returned too
 */
export const getUser = async (id: number, secureOrigin = false) => {
  let user = (<User[]>(
    await cachedQuery(
      CacheCategories.USER,
      id,
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id]
    )
  ))[0];
  if (!user) throw new Error(ErrorCode.USER_NOT_FOUND);
  if (!secureOrigin) user = deleteSensitiveInfoUser(user);
  return user;
};

/**
 * Get the details of a user by their email
 */
export const getUserByEmail = async (email: string, secureOrigin = false) => {
  email = normalizeEmail(email) || email;
  const emailObject = await getEmailObject(email);
  if (!emailObject) throw new Error(ErrorCode.USER_NOT_FOUND);
  return await getUser(emailObject.userId, secureOrigin);
};

/**
 * Update a user's details
 */
export const updateUser = async (id: number, user: KeyValue) => {
  user.updatedAt = dateToDateTime(new Date());
  user = removeReadOnlyValues(user);
  deleteItemFromCache(CacheCategories.USER, id);
  deleteItemFromCache(CacheCategories.USER_EMAILS, id);
  return await query(`UPDATE users SET ${setValues(user)} WHERE id = ?`, [
    ...Object.values(user),
    id
  ]);
};

/**
 * Delete a user
 */
export const deleteUser = async (id: number) => {
  deleteItemFromCache(CacheCategories.USER, id);
  return await query("DELETE FROM users WHERE id = ?", [id]);
};

/**
 * Add a new approved location for a user
 * @param ipAddress  IP address for the new location
 */
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
  deleteItemFromCache(CacheCategories.APPROVE_LOCATIONS, userId);
  deleteItemFromCache(CacheCategories.APPROVE_LOCATION, subnet);
  return await query(
    `INSERT INTO \`approved-locations\` ${tableValues(subnetLocation)}`,
    Object.values(subnetLocation)
  );
};

/**
 * Get a list of all approved locations of a user
 */
export const getUserApprovedLocations = async (userId: number) => {
  return await cachedQuery(
    CacheCategories.APPROVE_LOCATIONS,
    userId,
    "SELECT * FROM `approved-locations` WHERE userId = ?",
    [userId]
  );
};

/**
 * Check whether a location is approved for a user
 * @param ipAddress  IP address for checking
 */
export const checkApprovedLocation = async (
  userId: number,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  const approvedLocations = <ApprovedLocation[]>(
    await cachedQuery(
      CacheCategories.APPROVE_LOCATION,
      subnet,
      "SELECT * FROM `approved-locations` WHERE userId = ? AND subnet = ? LIMIT 1",
      [userId, subnet]
    )
  );
  if (!approvedLocations.length) return false;
  return true;
};
