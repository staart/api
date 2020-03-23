import {
  OAUTH_ERROR,
  OAUTH_IDENTITY_TAKEN,
  OAUTH_NO_ID,
  USERNAME_EXISTS,
  USER_NOT_FOUND
} from "@staart/errors";
import {
  anonymizeIpAddress,
  capitalizeFirstAndLastLetter,
  createSlug,
  hash,
  slugify
} from "@staart/text";
import Axios from "axios";
import ClientOAuth2 from "client-oauth2";
import { createHash } from "crypto";
import { decode } from "jsonwebtoken";
import randomInt from "random-int";
import {
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  TOKEN_EXPIRY_API_KEY_MAX
} from "../config";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";
import { accessToken, invalidateToken } from "../helpers/jwt";
import {
  query,
  removeReadOnlyValues,
  setValues,
  tableName,
  tableValues
} from "../helpers/mysql";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { CacheCategories, NotificationEmails } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { InsertResult } from "../interfaces/mysql";
import {
  AccessToken,
  ApprovedLocation,
  BackupCode,
  Identity,
  Session,
  User
} from "../interfaces/tables/user";
import { getPaginatedData } from "./data";
import { getEmail, getVerifiedEmailObject } from "./email";

export const getBestUsernameForUser = async (name: string) => {
  let result: string;
  if (name.split(" ")[0].length) {
    result = slugify(name.split(" ")[0]);
    if (await checkUsernameAvailability(result)) return result;
  }
  result = slugify(name);
  if (await checkUsernameAvailability(result)) return result;

  let available = false;
  while (!available) {
    result = createSlug(name);
    if (await checkUsernameAvailability(result)) available = true;
  }
  return result;
};

/**
 * Get a list of all ${tableName("users")}
 */
export const getAllUsers = async () => {
  return (await query(`SELECT * from ${tableName("users")}`)) as Array<User>;
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
    `https://api.adorable.io/avatars/285/${createHash("md5")
      .update(user.name)
      .digest("hex")}.png`;
  user.createdAt = new Date();
  user.updatedAt = user.createdAt;
  // Create user
  const result = (await query(
    `INSERT INTO ${tableName("users")} ${tableValues(user)}`,
    Object.values(user)
  )) as InsertResult;
  if (user.username)
    deleteItemFromCache(CacheCategories.USER_USERNAME, user.username);
  deleteItemFromCache(CacheCategories.USER, result.insertId);
  return result;
};

/**
 * Get the details of a user
 * @param secureOrigin  Whether security keys (password/tokens) should be returned too
 */
export const getUser = async (id: string, secureOrigin = false) => {
  let user = ((await cachedQuery(
    CacheCategories.USER,
    id,
    `SELECT * FROM ${tableName("users")} WHERE id = ? LIMIT 1`,
    [id]
  )) as Array<User>)[0];
  if (!user) throw new Error(USER_NOT_FOUND);
  if (!secureOrigin) user = deleteSensitiveInfoUser(user);
  return user;
};

/**
 * Get the details of a user by their email
 */
export const getUserByEmail = async (email: string, secureOrigin = false) => {
  const emailObject = await getVerifiedEmailObject(email);
  if (!emailObject || !emailObject.userId) throw new Error(USER_NOT_FOUND);
  return getUser(emailObject.userId, secureOrigin);
};

/*
 * Get user ID from a username
 */
export const getUserIdFromUsername = async (username: string) => {
  const user = ((await cachedQuery(
    CacheCategories.USER_USERNAME,
    username,
    `SELECT id FROM ${tableName("users")} WHERE username = ? LIMIT 1`,
    [username]
  )) as Array<User>)[0];
  if (user && user.id) return parseInt(user.id).toString();
  throw new Error(USER_NOT_FOUND);
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
      user.profilePicture = `https://www.gravatar.com/avatar/${createHash("md5")
        .update(emailDetails.email)
        .digest("hex")}?d=${encodeURIComponent(
        `https://api.adorable.io/avatars/285/${createHash("md5")
          .update(originalUser.name)
          .digest("hex")}.png`
      )}`;
    }
  }
  // If you're updating your username, make sure it's available
  if (user.username) {
    const originalUser = await getUser(id);
    let usernameOwner: User | undefined;
    try {
      usernameOwner = await getUserByUsername(user.username);
    } catch (error) {}
    if (
      usernameOwner &&
      usernameOwner.id &&
      usernameOwner.id != originalUser.id
    )
      throw new Error(USERNAME_EXISTS);
    if (originalUser.username && user.username !== originalUser.username)
      deleteItemFromCache(CacheCategories.USER_USERNAME, originalUser.username);
  }
  deleteItemFromCache(CacheCategories.USER, id);
  return query(
    `UPDATE ${tableName("users")} SET ${setValues(user)} WHERE id = ?`,
    [...Object.values(user), id]
  );
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string) => {
  deleteItemFromCache(CacheCategories.USER, id);
  return query(`DELETE FROM ${tableName("users")} WHERE id = ?`, [id]);
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
  return query(
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
  return query(
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
  )) as Array<User>)[0];
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
  return query(
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
  const approvedLocations = (await query(
    `SELECT * FROM ${tableName(
      "approved-locations"
    )} WHERE userId = ? AND subnet = ? LIMIT 1`,
    [userId, subnet]
  )) as Array<ApprovedLocation>;
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
  return query(
    `UPDATE ${tableName("backup-codes")} SET ${setValues(code)} WHERE code = ?`,
    [...Object.values(code), backupCode]
  );
};

/**
 * Delete a backup code
 */
export const deleteBackupCode = async (backupCode: number) => {
  return query(`DELETE FROM ${tableName("backup-codes")} WHERE code = ?`, [
    backupCode
  ]);
};

/**
 * Delete all backup codes of a user
 */
export const deleteUserBackupCodes = async (userId: string) => {
  return query(`DELETE FROM ${tableName("backup-codes")} WHERE userId = ?`, [
    userId
  ]);
};

/**
 * Get all backup codes of a user
 */
export const getUserBackupCodes = async (
  userId: string
): Promise<Array<BackupCode>> => {
  return query(`SELECT * FROM ${tableName("backup-codes")} WHERE userId = ?`, [
    userId
  ]);
};

/**
 * Get a specific backup code
 */
export const getUserBackupCode = async (userId: string, backupCode: number) => {
  return ((await query(
    `SELECT * FROM ${tableName(
      "backup-codes"
    )} WHERE userId = ? AND code = ? LIMIT 1`,
    [userId, backupCode]
  )) as Array<BackupCode>)[0];
};

/**
 * Get a list of all approved locations of a user
 */
export const getUserAccessTokens = async (userId: string, query: KeyValue) => {
  return getPaginatedData<AccessToken>({
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
  return ((await query(
    `SELECT * FROM ${tableName(
      "access-tokens"
    )} WHERE id = ? AND userId = ? LIMIT 1`,
    [accessTokenId, userId]
  )) as Array<AccessToken>)[0];
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
  return query(
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
  return query(
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
  return query(
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
  const data = await getPaginatedData<Session>({
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
  return data;
};

/**
 * Get a session
 */
export const getSession = async (userId: string, sessionId: string) => {
  const data = ((await query(
    `SELECT * FROM ${tableName(
      "sessions"
    )} WHERE id = ? AND userId = ? LIMIT 1`,
    [sessionId, userId]
  )) as Array<Session>)[0];
  if (data) delete data.jwtToken;
  return data;
};

/**
 * Create a session
 */
export const createSession = async (newSession: Session) => {
  newSession.createdAt = new Date();
  newSession.updatedAt = newSession.createdAt;
  return query(
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
  return query(
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
  try {
    const decoded = decode(sessionJwt);
    if (decoded && typeof decoded === "object" && decoded.jti) {
      sessionJwt = decoded.jti;
    }
  } catch (error) {}
  return query(
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
  return query(
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
  return query(
    `DELETE FROM ${tableName("sessions")} WHERE id = ? AND userId = ? LIMIT 1`,
    [sessionId, userId]
  );
};

/**
 * Get a list of all identities of a user
 */
export const getUserIdentities = async (userId: string, query: KeyValue) => {
  const data = await getPaginatedData<Identity>({
    table: "identities",
    conditions: {
      userId
    },
    ...query,
    sort: "desc"
  });
  return data;
};

/**
 * Get a identity
 */
export const getIdentity = async (userId: string, identityId: string) => {
  const data = ((await query(
    `SELECT * FROM ${tableName(
      "identities"
    )} WHERE id = ? AND userId = ? LIMIT 1`,
    [identityId, userId]
  )) as Array<Identity>)[0];
  return data;
};

/**
 * Get a identity
 */
export const getIdentityByServiceId = async (service: string, id: string) => {
  const data = ((await query(
    `SELECT * FROM ${tableName(
      "identities"
    )} WHERE type = ? AND identityId = ? LIMIT 1`,
    [service, id]
  )) as Array<Identity>)[0];
  return data;
};

const github = new ClientOAuth2({
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  redirectUri: `${FRONTEND_URL}/auth/connect-identity/github`,
  authorizationUri: "https://github.com/login/oauth/authorize",
  accessTokenUri: "https://github.com/login/oauth/access_token",
  scopes: ["read:user", "user:email"]
});
const microsoft = new ClientOAuth2({
  clientId: MICROSOFT_CLIENT_ID,
  clientSecret: MICROSOFT_CLIENT_SECRET,
  redirectUri: `${FRONTEND_URL}/auth/connect-identity/microsoft`,
  authorizationUri: "https://login.microsoftonline.com/common/oauth2/authorize",
  accessTokenUri: "https://login.microsoftonline.com/common/oauth2/token",
  scopes: ["user.read"]
});
const facebook = new ClientOAuth2({
  clientId: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  redirectUri: `${FRONTEND_URL}/auth/connect-identity/facebook`,
  authorizationUri: "https://www.facebook.com/v4.0/dialog/oauth",
  accessTokenUri: "https://graph.facebook.com/v4.0/oauth/access_token",
  scopes: ["default"]
});

/**
 * Create a identity: Get an OAuth link
 */
export const createIdentityGetOAuthLink = async (
  userId: string,
  newIdentity: KeyValue
) => {
  if (newIdentity.service === "github") {
    return { url: github.code.getUri() };
  }

  if (newIdentity.service === "microsoft") {
    return { url: microsoft.code.getUri() };
  }

  if (newIdentity.service === "facebook") {
    return {
      url: facebook.code
        .getUri()
        .replace("&scope=default&response_type=code", "")
    };
  }

  throw new Error(OAUTH_ERROR);
};

/**
 * Create a identity: Check if available
 */
export const checkIdentityAvailability = async (
  service: string,
  id: string
) => {
  let has = false;
  try {
    const identity = await getIdentityByServiceId(service, id);
    if (identity && identity.id) has = true;
  } catch (error) {}
  if (has) throw new Error(OAUTH_IDENTITY_TAKEN);
  return true;
};

/**
 * Create a identity: Connect OAuth
 */
export const createIdentityConnect = async (
  userId: string,
  service: string,
  url: string
) => {
  let data: any;
  try {
    if (service === "github") {
      const token = (await github.code.getToken(url)).accessToken;
      data = (
        await Axios.get("https://api.github.com/user", {
          headers: {
            Authorization: `token ${token}`
          }
        })
      ).data;
    }

    if (service === "microsoft") {
      const token = decode((await microsoft.code.getToken(url)).accessToken);
      if (token && typeof token === "object")
        data = {
          id: token.puid,
          login: token.email
        };
    }

    if (service === "facebook") {
      const token = (await facebook.code.getToken(url)).accessToken;
      const result = (
        await Axios.get(
          `https://graph.facebook.com/v4.0/me?access_token=${token}`
        )
      ).data;
      data = {
        id: result.id,
        login: result.name
      };
    }
  } catch (error) {
    throw new Error(OAUTH_ERROR);
  }

  console.log("I got data", data);

  if (!data || !data.id) throw new Error(OAUTH_NO_ID);
  await checkIdentityAvailability(service, data.id);
  await createIdentity({
    userId,
    identityId: data.id,
    type: service,
    loginName: data.login
  });
  return { success: true };
};

/**
 * Create a identity
 */
export const createIdentity = async (newIdentity: Identity) => {
  newIdentity.createdAt = new Date();
  newIdentity.updatedAt = newIdentity.createdAt;
  return query(
    `INSERT INTO ${tableName("identities")} ${tableValues(newIdentity)}`,
    Object.values(newIdentity)
  );
};

/**
 * Update a user's identity
 */
export const updateIdentity = async (
  userId: string,
  identityId: string,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  return query(
    `UPDATE ${tableName("identities")} SET ${setValues(
      data
    )} WHERE id = ? AND userId = ?`,
    [...Object.values(data), identityId, userId]
  );
};

/**
 * Delete an identity
 */
export const deleteIdentity = async (userId: string, identityId: string) => {
  await getIdentity(userId, identityId);
  return query(
    `DELETE FROM ${tableName(
      "identities"
    )} WHERE id = ? AND userId = ? LIMIT 1`,
    [identityId, userId]
  );
};
