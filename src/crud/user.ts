import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues,
  tableName
} from "../helpers/mysql";
import {
  User,
  ApprovedLocation,
  BackupCode,
  AccessToken,
  Session
} from "../interfaces/tables/user";
import {
  capitalizeFirstAndLastLetter,
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
import { getPaginatedData } from "./data";
import { accessToken, invalidateToken } from "../helpers/jwt";
import { TOKEN_EXPIRY_API_KEY_MAX } from "../config";
import {
  addLocationToSession,
  addLocationToSessions
} from "../helpers/location";

/**
 * Get a list of all ${tableName("users")}
 */
export const getAllUsers = async () => {
  return <User[]>await query(`SELECT * from ${tableName("users")}`);
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
  user.password = user.password ? await hash(user.password, 8) : undefined;
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
    `INSERT INTO ${tableName("users")} ${tableValues(user)}`,
    Object.values(user)
  );
};

/**
 * Get the details of a user
 * @param secureOrigin  Whether security keys (password/tokens) should be returned too
 */
export const getUser = async (id: string, secureOrigin = false) => {
  let user = (<User[]>(
    await cachedQuery(
      CacheCategories.USER,
      id,
      `SELECT * FROM ${tableName("users")} WHERE id = ? LIMIT 1`,
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

/*
 * Get user ID from a username
 */
export const getUserIdFromUsername = async (username: string) => {
  const user = (<User[]>(
    await cachedQuery(
      CacheCategories.USER_USERNAME,
      username,
      `SELECT id FROM ${tableName("users")} WHERE username = ? LIMIT 1`,
      [username]
    )
  ))[0];
  if (user && user.id) return user.id;
  throw new Error(ErrorCode.USER_NOT_FOUND);
};

/**
 * Update a user's details
 */
export const updateUser = async (id: string, user: KeyValue) => {
  user.updatedAt = new Date();
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
    if (originalUser.username && user.username !== originalUser.username)
      deleteItemFromCache(CacheCategories.USER_USERNAME, originalUser.username);
  }
  deleteItemFromCache(CacheCategories.USER, id);
  return await query(
    `UPDATE ${tableName("users")} SET ${setValues(user)} WHERE id = ?`,
    [...Object.values(user), id]
  );
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string) => {
  deleteItemFromCache(CacheCategories.USER, id);
  return await query(`DELETE FROM ${tableName("users")} WHERE id = ?`, [id]);
};

/**
 * Add a new approved location for a user
 * @param ipAddress  IP address for the new location
 */
export const addApprovedLocation = async (
  userId: string,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  const subnetLocation: ApprovedLocation = {
    userId,
    subnet,
    createdAt: new Date()
  };
  return await query(
    `INSERT INTO ${tableName("approved-locations")} ${tableValues(
      subnetLocation
    )}`,
    Object.values(subnetLocation)
  );
};

/**
 * Get a list of all approved locations of a user
 */
export const getUserApprovedLocations = async (userId: string) => {
  return await query(
    `SELECT * FROM ${tableName("approved-locations")} WHERE userId = ?`,
    [userId]
  );
};

/**
 * Get a user by their username
 */
export const getUserByUsername = async (username: string) => {
  return ((await query(
    `SELECT * FROM ${tableName("users")} WHERE username = ? LIMIT 1`,
    [username]
  )) as User[])[0];
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
export const deleteAllUserApprovedLocations = async (userId: string) => {
  return await query(
    `DELETE FROM ${tableName("approved-locations")} WHERE userId = ?`,
    [userId]
  );
};

/**
 * Check whether a location is approved for a user
 * @param ipAddress  IP address for checking
 */
export const checkApprovedLocation = async (
  userId: string,
  ipAddress: string
) => {
  const user = await getUser(userId);
  if (!user.checkLocationOnLogin) return true;
  const subnet = anonymizeIpAddress(ipAddress);
  const approvedLocations = <ApprovedLocation[]>(
    await query(
      `SELECT * FROM ${tableName(
        "approved-locations"
      )} WHERE userId = ? AND subnet = ? LIMIT 1`,
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
export const createBackupCodes = async (userId: string, count = 1) => {
  for await (const x of Array.from(Array(count).keys())) {
    const code: BackupCode = { code: randomInt(100000, 999999), userId };
    code.createdAt = new Date();
    code.updatedAt = code.createdAt;
    await query(
      `INSERT INTO ${tableName("backup-codes")} ${tableValues(code)}`,
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
    `UPDATE ${tableName("backup-codes")} SET ${setValues(code)} WHERE code = ?`,
    [...Object.values(code), backupCode]
  );
};

/**
 * Delete a backup code
 */
export const deleteBackupCode = async (backupCode: number) => {
  return await query(
    `DELETE FROM ${tableName("backup-codes")} WHERE code = ?`,
    [backupCode]
  );
};

/**
 * Delete all backup codes of a user
 */
export const deleteUserBackupCodes = async (userId: string) => {
  return await query(
    `DELETE FROM ${tableName("backup-codes")} WHERE userId = ?`,
    [userId]
  );
};

/**
 * Get all backup codes of a user
 */
export const getUserBackupCodes = async (userId: string) => {
  return await query(
    `SELECT * FROM ${tableName("backup-codes")} WHERE userId = ?`,
    [userId]
  );
};

/**
 * Get a specific backup code
 */
export const getUserBackupCode = async (userId: string, backupCode: number) => {
  return (<BackupCode[]>(
    await query(
      `SELECT * FROM ${tableName(
        "backup-codes"
      )} WHERE userId = ? AND code = ? LIMIT 1`,
      [userId, backupCode]
    )
  ))[0];
};

/**
 * Get a list of all approved locations of a user
 */
export const getUserAccessTokens = async (userId: string, query: KeyValue) => {
  return await getPaginatedData({
    table: "access-tokens",
    conditions: {
      userId
    },
    ...query
  });
};

/**
 * Get an API key
 */
export const getAccessToken = async (userId: string, accessTokenId: string) => {
  return (<AccessToken[]>(
    await query(
      `SELECT * FROM ${tableName(
        "access-tokens"
      )} WHERE id = ? AND userId = ? LIMIT 1`,
      [accessTokenId, userId]
    )
  ))[0];
};

/**
 * Create an API key
 */
export const createAccessToken = async (newAccessToken: AccessToken) => {
  newAccessToken.expiresAt =
    newAccessToken.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
  newAccessToken.createdAt = new Date();
  newAccessToken.updatedAt = newAccessToken.createdAt;
  newAccessToken.jwtAccessToken = await accessToken(newAccessToken);
  return await query(
    `INSERT INTO ${tableName("access-tokens")} ${tableValues(newAccessToken)}`,
    Object.values(newAccessToken)
  );
};

/**
 * Update a user's details
 */
export const updateAccessToken = async (
  userId: string,
  accessTokenId: string,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  const newAccessToken = await getAccessToken(userId, accessTokenId);
  if (newAccessToken.jwtAccessToken)
    await invalidateToken(newAccessToken.jwtAccessToken);
  data.jwtAccessToken = await accessToken({ ...newAccessToken, ...data });
  return await query(
    `UPDATE ${tableName("access-tokens")} SET ${setValues(
      data
    )} WHERE id = ? AND userId = ?`,
    [...Object.values(data), accessTokenId, userId]
  );
};

/**
 * Delete an API key
 */
export const deleteAccessToken = async (
  userId: string,
  accessTokenId: string
) => {
  const currentAccessToken = await getAccessToken(userId, accessTokenId);
  if (currentAccessToken.jwtAccessToken)
    await invalidateToken(currentAccessToken.jwtAccessToken);
  return await query(
    `DELETE FROM ${tableName(
      "access-tokens"
    )} WHERE id = ? AND userId = ? LIMIT 1`,
    [accessTokenId, userId]
  );
};

/**
 * Get a list of all valid sessions of a user
 */
export const getUserSessions = async (userId: string, query: KeyValue) => {
  const data = await getPaginatedData({
    table: "sessions",
    conditions: {
      userId
    },
    ...query,
    sort: "desc"
  });
  data.data.forEach((item, index) => {
    delete data.data[index].jwtToken;
  });
  data.data = await addLocationToSessions(data.data);
  return data;
};

/**
 * Get a session
 */
export const getSession = async (userId: string, sessionId: string) => {
  const data = await addLocationToSession(
    (<Session[]>(
      await query(
        `SELECT * FROM ${tableName(
          "sessions"
        )} WHERE id = ? AND userId = ? LIMIT 1`,
        [sessionId, userId]
      )
    ))[0]
  );
  if (data) delete data.jwtToken;
  return data;
};

/**
 * Create a session
 */
export const createSession = async (newSession: Session) => {
  newSession.createdAt = new Date();
  newSession.updatedAt = newSession.createdAt;
  return await query(
    `INSERT INTO ${tableName("sessions")} ${tableValues(newSession)}`,
    Object.values(newSession)
  );
};

/**
 * Update a user's details
 */
export const updateSession = async (
  userId: string,
  sessionId: string,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  return await query(
    `UPDATE ${tableName("sessions")} SET ${setValues(
      data
    )} WHERE id = ? AND userId = ?`,
    [...Object.values(data), sessionId, userId]
  );
};

/**
 * Update a user's details
 */
export const updateSessionByJwt = async (
  userId: string,
  sessionJwt: string,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  return await query(
    `UPDATE ${tableName("sessions")} SET ${setValues(
      data
    )} WHERE jwtToken = ? AND userId = ?`,
    [...Object.values(data), sessionJwt, userId]
  );
};

/**
 * Update a user's details
 */
export const deleteSessionByJwt = async (
  userId: string,
  sessionJwt: string
) => {
  return await query(
    `DELETE FROM ${tableName("sessions")} WHERE jwtToken = ? AND userId = ?`,
    [sessionJwt, userId]
  );
};

/**
 * Invalidate a session
 */
export const deleteSession = async (userId: string, sessionId: string) => {
  const currentSession = await getSession(userId, sessionId);
  if (currentSession.jwtToken) await invalidateToken(currentSession.jwtToken);
  return await query(
    `DELETE FROM ${tableName("sessions")} WHERE id = ? AND userId = ? LIMIT 1`,
    [sessionId, userId]
  );
};
