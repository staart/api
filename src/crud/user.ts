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
import { hash } from "bcryptjs";
import { KeyValue } from "../interfaces/general";
import {
  ErrorCode,
  NotificationEmails,
  CacheCategories
} from "../interfaces/enum";
import { getEmail, getVerifiedEmailObject } from "./email";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";
import md5 from "md5";
import randomInt from "random-int";
import { BackupCode } from "../interfaces/tables/backup-codes";

/**
 * Get a list of all users
 */
export const getAllUsers = async () => {
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
  user.prefersColorSchemeDark = user.prefersColorSchemeDark || false;
  user.profilePicture =
    user.profilePicture ||
    `https://api.adorable.io/avatars/285/${md5(user.name)}.png`;
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
  const emailObject = await getVerifiedEmailObject(email);
  if (!emailObject || !emailObject.userId)
    throw new Error(ErrorCode.USER_NOT_FOUND);
  return await getUser(emailObject.userId, secureOrigin);
};

/**
 * Update a user's details
 */
export const updateUser = async (id: number, user: KeyValue) => {
  user.updatedAt = dateToDateTime(new Date());
  if (user.password) user.password = await hash(user.password, 8);
  user = removeReadOnlyValues(user);
  // If you're updating your primary email, your Gravatar should reflect it
  if (user.primaryEmail) {
    const originalUser = await getUser(id);
    if ((originalUser.profilePicture || "").includes("api.adorable.io")) {
      const emailDetails = await getEmail(user.primaryEmail);
      user.profilePicture = `https://www.gravatar.com/avatar/${md5(
        emailDetails.email
      )}?d=${encodeURIComponent(
        `https://api.adorable.io/avatars/285/${md5(originalUser.name)}.png`
      )}`;
    }
  }
  // If you're updating your username, make sure it's available
  if (user.username) {
    const originalUser = await getUser(id);
    let usernameOwner: User | undefined = undefined;
    try {
      usernameOwner = await getUserByUsername(user.username);
    } catch (error) {}
    if (
      usernameOwner &&
      usernameOwner.id &&
      usernameOwner.id != originalUser.id
    )
      throw new Error(ErrorCode.USERNAME_EXISTS);
  }
  deleteItemFromCache(CacheCategories.USER, id);
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
  return await query(
    `INSERT INTO \`approved-locations\` ${tableValues(subnetLocation)}`,
    Object.values(subnetLocation)
  );
};

/**
 * Get a list of all approved locations of a user
 */
export const getUserApprovedLocations = async (userId: number) => {
  return await query("SELECT * FROM `approved-locations` WHERE userId = ?", [
    userId
  ]);
};

/**
 * Get a user by their username
 */
export const getUserByUsername = async (username: string) => {
  return ((await query("SELECT * FROM users WHERE username = ? LIMIT 1", [
    username
  ])) as User[])[0];
};

/**
 * Get a user by their username
 */
export const checkUsernameAvailability = async (username: string) => {
  try {
    const user = await getUserByUsername(username);
    if (user && user.id) return false;
  } catch (error) {}
  return true;
};

/**
 * Delete all approved locations for a user
 */
export const deleteAllUserApprovedLocations = async (userId: number) => {
  return await query("DELETE FROM `approved-locations` WHERE userId = ?", [
    userId
  ]);
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
    await query(
      "SELECT * FROM `approved-locations` WHERE userId = ? AND subnet = ? LIMIT 1",
      [userId, subnet]
    )
  );
  if (!approvedLocations.length) return false;
  return true;
};

/**
 * Create 2FA backup codes for user
 * @param count - Number of backup codes to create
 */
export const createBackupCodes = async (userId: number, count = 1) => {
  for await (const x of Array.from(Array(count).keys())) {
    const code: BackupCode = { code: randomInt(100000, 999999), userId };
    code.createdAt = new Date();
    code.updatedAt = code.createdAt;
    await query(
      `INSERT INTO \`backup-codes\` ${tableValues(code)}`,
      Object.values(code)
    );
  }
  return;
};

/**
 * Update a backup code
 */
export const updateBackupCode = async (backupCode: number, code: KeyValue) => {
  code.updatedAt = new Date();
  return await query(
    `UPDATE \`backup-codes\` SET ${setValues(code)} WHERE code = ?`,
    [...Object.values(code), backupCode]
  );
};

/**
 * Delete a backup code
 */
export const deleteBackupCode = async (backupCode: number) => {
  return await query("DELETE FROM `backup-codes` WHERE code = ?", [backupCode]);
};

/**
 * Delete all backup codes of a user
 */
export const deleteUserBackupCodes = async (userId: number) => {
  return await query("DELETE FROM `backup-codes` WHERE userId = ?", [userId]);
};

/**
 * Get all backup codes of a user
 */
export const getUserBackupCodes = async (userId: number) => {
  return await query("SELECT * FROM `backup-codes` WHERE userId = ?", [userId]);
};

/**
 * Get a specific backup code
 */
export const getUserBackupCode = async (userId: number, backupCode: number) => {
  return (<BackupCode[]>(
    await query(
      "SELECT * FROM `backup-codes` WHERE userId = ? AND code = ? LIMIT 1",
      [userId, backupCode]
    )
  ))[0];
};
