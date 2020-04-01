import {
  USERNAME_EXISTS,
  USER_NOT_FOUND,
  RESOURCE_NOT_FOUND
} from "@staart/errors";
import {
  anonymizeIpAddress,
  capitalizeFirstAndLastLetter,
  createSlug,
  hash,
  slugify
} from "@staart/text";
import { createHash } from "crypto";
import randomInt from "random-int";
import { TOKEN_EXPIRY_API_KEY_MAX } from "../config";
import { deleteItemFromCache } from "../helpers/cache";
import { accessToken, invalidateToken } from "../helpers/jwt";
import { removeReadOnlyValues } from "../helpers/mysql";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { CacheCategories, NotificationEmails } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import { users, access_tokens } from "@prisma/client";

/**
 * Get the best available username for a user
 * For example, if the user's name is "Anand Chowdhary"
 * Usernames: "anand", "anand-chowdhary", "anand-chowdhary-a29hi3q"
 * @param name - Name of user
 */
export const getBestUsernameForUser = async (name: string) => {
  let result: string;
  if (name.split(" ")[0].length) {
    result = slugify(name.split(" ")[0]);
    if (!(await prisma.users.findMany({ where: { username: result } })).length)
      return result;
  }
  result = slugify(name);
  if (!(await prisma.users.findMany({ where: { username: result } })).length)
    return result;

  let available = false;
  while (!available) {
    result = createSlug(name);
    if (!(await prisma.users.findMany({ where: { username: result } })).length)
      available = true;
  }
  return result;
};

/**
 * Create a new user
 */
export const createUser = async (user: users) => {
  // Clean up values
  user.name = capitalizeFirstAndLastLetter(user.name);
  // Default values for user
  user.nickname = user.nickname || user.name.split(" ")[0];
  user.twoFactorEnabled = user.twoFactorEnabled || 0;
  user.timezone = user.timezone || "Europe/Amsterdam";
  user.password = user.password ? await hash(user.password, 8) : null;
  user.notificationEmails =
    user.notificationEmails || NotificationEmails.GENERAL;
  user.preferredLanguage = user.preferredLanguage || "en-us";
  user.prefersReducedMotion = user.prefersReducedMotion || 0;
  user.prefersColorSchemeDark = user.prefersColorSchemeDark || 0;
  user.profilePicture =
    user.profilePicture ||
    `https://api.adorable.io/avatars/285/${createHash("md5")
      .update(user.name)
      .digest("hex")}.png`;
  user.createdAt = new Date();
  user.updatedAt = user.createdAt;
  // Create user
  const result = await prisma.users.create({
    data: user
  });
  if (user.username)
    deleteItemFromCache(CacheCategories.USER_USERNAME, user.username);
  deleteItemFromCache(CacheCategories.USER, result.id);
  return result;
};

/**
 * Get the details of a user by their email
 */
export const getUserByEmail = async (email: string, secureOrigin = false) => {
  const emailObject = await prisma.emails.findMany({
    where: { email, isVerified: 1 }
  });
  if (!emailObject.length) throw new Error(USER_NOT_FOUND);
  const user = await prisma.users.findOne({ where: { id: emailObject[0].id } });
  if (!user) throw new Error(USER_NOT_FOUND);
  if (!secureOrigin) return deleteSensitiveInfoUser(user);
  return user;
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
    const originalUser = await prisma.users.findOne({
      where: { id: parseInt(id) }
    });
    if (!originalUser) throw new Error(USER_NOT_FOUND);
    if ((originalUser.profilePicture || "").includes("api.adorable.io")) {
      const emailDetails = await prisma.emails.findOne({
        where: { id: user.primaryEmail }
      });
      if (emailDetails)
        user.profilePicture = `https://www.gravatar.com/avatar/${createHash(
          "md5"
        )
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
    const originalUser = await prisma.users.findOne({
      where: { id: parseInt(id) }
    });
    if (!originalUser) throw new Error(USER_NOT_FOUND);
    const currentOwnerOfUsername = await prisma.users.findMany({
      where: { username: user.username }
    });
    if (currentOwnerOfUsername.length) {
      if (currentOwnerOfUsername[0].id !== originalUser.id)
        throw new Error(USERNAME_EXISTS);
      if (originalUser.username && user.username !== originalUser.username)
        deleteItemFromCache(
          CacheCategories.USER_USERNAME,
          originalUser.username
        );
    }
  }
  deleteItemFromCache(CacheCategories.USER, id);
  return await prisma.users.update({ data: user, where: { id: parseInt(id) } });
};

/**
 * Add a new approved location for a user
 * @param ipAddress - IP address for the new location
 */
export const addApprovedLocation = async (
  userId: string,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  return prisma.approved_locations.create({
    data: {
      userId: parseInt(userId),
      subnet,
      createdAt: new Date()
    }
  });
};

/**
 * Check whether a location is approved for a user
 * @param ipAddress - IP address for checking
 */
export const checkApprovedLocation = async (
  userId: string,
  ipAddress: string
) => {
  const user = await prisma.users.findOne({ where: { id: parseInt(userId) } });
  if (!user) throw new Error(USER_NOT_FOUND);
  if (!user.checkLocationOnLogin) return true;
  const subnet = anonymizeIpAddress(ipAddress);
  return (
    (
      await prisma.approved_locations.findMany({
        where: { userId: parseInt(userId), subnet }
      })
    ).length !== 0
  );
};

/**
 * Create 2FA backup codes for user
 * @param count - Number of backup codes to create
 */
export const createBackupCodes = async (userId: string, count = 1) => {
  const now = new Date();
  for await (const _ of Array.from(Array(count).keys())) {
    await prisma.backup_codes.create({
      data: {
        code: randomInt(100000, 999999),
        userId: parseInt(userId),
        createdAt: now,
        updatedAt: now
      }
    });
  }
  return;
};

/**
 * Create an API key
 */
export const createAccessToken = async (data: access_tokens) => {
  data.expiresAt = data.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
  data.createdAt = new Date();
  data.updatedAt = data.createdAt;
  data.jwtAccessToken = await accessToken(data);
  return prisma.access_tokens.create({ data });
};

/**
 * Update a user's details
 */
export const updateAccessToken = async (
  accessTokenId: string,
  data: access_tokens
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  const newAccessToken = await prisma.access_tokens.findOne({
    where: { id: parseInt(accessTokenId) }
  });
  if (!newAccessToken) throw new Error(RESOURCE_NOT_FOUND);
  if (newAccessToken.jwtAccessToken)
    await invalidateToken(newAccessToken.jwtAccessToken);
  data.jwtAccessToken = await accessToken({ ...newAccessToken, ...data });
  return prisma.access_tokens.update({
    data,
    where: { id: parseInt(accessTokenId) }
  });
};

/**
 * Delete an API key
 */
export const deleteAccessToken = async (accessTokenId: string) => {
  const currentAccessToken = await prisma.access_tokens.findOne({
    where: { id: parseInt(accessTokenId) }
  });
  if (!currentAccessToken) throw new Error(RESOURCE_NOT_FOUND);
  if (currentAccessToken.jwtAccessToken)
    await invalidateToken(currentAccessToken.jwtAccessToken);
  return prisma.access_tokens.delete({
    where: { id: parseInt(accessTokenId) }
  });
};
