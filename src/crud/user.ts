import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues
} from "../helpers/mysql";
import { User, ApprovedLocation, ApiKey } from "../interfaces/tables/user";
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
import cryptoRandomString from "crypto-random-string";
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
    `https://ui-avatars.com/api/?bold=true&name=${user.name}`;
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
  user.password = await hash(user.password || "", 8);
  user = removeReadOnlyValues(user);
  if (user.primaryEmail) {
    const originalUser = await getUser(id);
    if ((originalUser.profilePicture || "").includes("ui-avatars.com")) {
      const emailDetails = await getEmail(user.primaryEmail);
      user.profilePicture = `https://www.gravatar.com/avatar/${md5(
        emailDetails.email
      )}?d=${encodeURIComponent(
        `https://ui-avatars.com/api/?bold=true&name=${originalUser.name}`
      )}`;
    }
  }
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
 * Delete all approved locations for a user
 */
export const deleteAllUserApprovedLocations = async (userId: number) => {
  deleteItemFromCache(CacheCategories.APPROVE_LOCATIONS, userId);
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

/**
 * Get a list of all approved locations of a user
 */
export const getUserApiKeys = async (userId: number) => {
  return <ApiKey[]>(
    await cachedQuery(
      CacheCategories.API_KEYS,
      userId,
      "SELECT * FROM `api-keys` WHERE userId = ?",
      [userId]
    )
  );
};

/**
 * Get an API key
 */
export const getApiKey = async (apiKey: string) => {
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  return (<ApiKey[]>(
    await query("SELECT * FROM `api-keys` WHERE apiKey = ? LIMIT 1", [apiKey])
  ))[0];
};

/**
 * Get an API key/secret
 */
export const getApiKeySecret = async (apiKey: string, secretKey: string) => {
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  return (<ApiKey[]>(
    await query(
      "SELECT * FROM `api-keys` WHERE apiKey = ? AND secretKey = ? LIMIT 1",
      [apiKey, secretKey]
    )
  ))[0];
};

/**
 * Create an API key
 */
export const createApiKey = async (apiKey: ApiKey) => {
  apiKey.apiKey = cryptoRandomString({ length: 20, type: "hex" });
  apiKey.secretKey = cryptoRandomString({ length: 20, type: "hex" });
  apiKey.createdAt = new Date();
  apiKey.updatedAt = apiKey.createdAt;
  deleteItemFromCache(CacheCategories.API_KEYS, apiKey.userId);
  return await query(
    `INSERT INTO \`api-keys\` ${tableValues(apiKey)}`,
    Object.values(apiKey)
  );
};

/**
 * Update a user's details
 */
export const updateApiKey = async (apiKey: string, data: KeyValue) => {
  const apiKeyDetails = await getApiKey(apiKey);
  data.updatedAt = dateToDateTime(new Date());
  data = removeReadOnlyValues(data);
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  deleteItemFromCache(CacheCategories.API_KEYS, apiKeyDetails.userId);
  return await query(
    `UPDATE \`api-keys\` SET ${setValues(data)} WHERE apiKey = ?`,
    [...Object.values(data), apiKey]
  );
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (apiKey: string) => {
  const apiKeyDetails = await getApiKey(apiKey);
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  deleteItemFromCache(CacheCategories.API_KEYS, apiKeyDetails.userId);
  return await query("DELETE FROM `api-keys` WHERE apiKey = ? LIMIT 1", [
    apiKey
  ]);
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
