import {
  USERNAME_EXISTS,
  USER_NOT_FOUND,
  RESOURCE_NOT_FOUND,
  MISSING_PRIMARY_EMAIL
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
import { deleteSensitiveInfoUser, PartialBy } from "../helpers/utils";
import { CacheCategories } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import {
  users,
  access_tokens,
  emailsCreateInput,
  access_tokensCreateInput,
  sessionsUpdateInput,
  usersCreateInput
} from "@prisma/client";
import { decode } from "jsonwebtoken";
import { emailVerificationToken } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { Templates } from "../interfaces/enum";
import { sendNewPassword } from "../rest/auth";

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
 * Check if an organization username is available
 */
export const checkUserUsernameAvailability = async (username: string) => {
  return (
    (
      await prisma.users.findMany({
        where: { username }
      })
    ).length === 0
  );
};

/**
 * Create a new user
 */
export const createUser = async (
  _user: PartialBy<usersCreateInput, "nickname">
) => {
  const user: usersCreateInput = { nickname: "", ..._user };
  user.name = capitalizeFirstAndLastLetter(user.name);
  user.nickname = user.nickname || user.name.split(" ")[0];
  user.password = user.password ? await hash(user.password, 8) : null;
  user.profilePicture =
    user.profilePicture ||
    `https://api.adorable.io/avatars/285/${createHash("md5")
      .update(user.name)
      .digest("hex")}.png`;
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
    where: { email, isVerified: true }
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
  userId: string | number,
  ipAddress: string
) => {
  if (typeof userId === "number") userId = userId.toString();
  const subnet = anonymizeIpAddress(ipAddress);
  return prisma.approved_locations.create({
    data: {
      user: { connect: { id: parseInt(userId) } },
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
  userId: string | number,
  ipAddress: string
) => {
  if (typeof userId === "number") userId = userId.toString();
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
export const createBackupCodes = async (userId: string | number, count = 1) => {
  if (typeof userId === "number") userId = userId.toString();
  const now = new Date();
  for await (const _ of Array.from(Array(count).keys())) {
    await prisma.backup_codes.create({
      data: {
        code: randomInt(100000, 999999).toString(),
        user: { connect: { id: parseInt(userId) } },
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
export const createAccessToken = async (data: access_tokensCreateInput) => {
  data.expiresAt = data.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
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

/**
 * Get the primary email of a user
 * @param userId - User Id
 */
export const getUserPrimaryEmail = async (userId: string | number) => {
  if (typeof userId === "number") userId = userId.toString();
  const primaryEmailId = (
    await prisma.users.findOne({
      select: { primaryEmail: true },
      where: { id: parseInt(userId) }
    })
  )?.primaryEmail;
  if (!primaryEmailId) throw new Error(MISSING_PRIMARY_EMAIL);
  const primaryEmail = await prisma.emails.findOne({
    where: { id: primaryEmailId }
  });
  if (!primaryEmail) throw new Error(MISSING_PRIMARY_EMAIL);
  return primaryEmail;
};

/**
 * Get the best email to contact a user
 * @param userId - User ID
 */
export const getUserBestEmail = async (userId: string | number) => {
  if (typeof userId === "number") userId = userId.toString();
  try {
    return await getUserPrimaryEmail(userId);
  } catch (error) {}
  const emails = await prisma.emails.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { isVerified: "desc" },
    first: 1
  });
  if (!emails.length) throw new Error(RESOURCE_NOT_FOUND);
  return emails[0];
};

/**
 * Update a session based on JWT
 * @param userId - User ID
 * @param sessionJwt - Provided session JWT
 * @param data - Session information to update
 */
export const updateSessionByJwt = async (
  userId: number,
  sessionJwt: string,
  data: sessionsUpdateInput
) => {
  data = removeReadOnlyValues(data);
  try {
    const decoded = decode(sessionJwt);
    if (decoded && typeof decoded === "object" && decoded.jti) {
      sessionJwt = decoded.jti;
    }
  } catch (error) {}
  const currentSession = await prisma.sessions.findMany({
    where: { jwtToken: sessionJwt, userId }
  });
  if (!currentSession.length) throw new Error(RESOURCE_NOT_FOUND);
  return prisma.sessions.update({ where: { id: currentSession[0].id }, data });
};

/**
 * Create a new email for a user
 * @param sendVerification  Whether to send an email verification link to new email
 * @param isVerified  Whether this email is verified by default
 */
export const createEmail = async (
  userId: number,
  email: emailsCreateInput,
  sendVerification = true,
  sendPasswordSet = false
) => {
  const result = await prisma.emails.create({
    data: { ...email, user: { connect: { id: userId } } }
  });
  if (sendVerification) {
    const user = await prisma.users.findOne({ where: { id: userId } });
    if (!user) throw new Error(USER_NOT_FOUND);
    await sendEmailVerification(result.id, email.email, user);
  }
  if (sendPasswordSet) await sendNewPassword(userId, email.email);
  return result;
};

/**
 * Send an email verification link
 */
export const sendEmailVerification = async (
  id: string | number,
  email: string,
  user: users
) => {
  if (typeof id === "number") id = id.toString();
  const token = await emailVerificationToken(id);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  return;
};

/**
 * Resend an email verification link
 */
export const resendEmailVerification = async (id: string | number) => {
  if (typeof id === "number") id = id.toString();
  const token = await emailVerificationToken(id);
  const emailObject = await prisma.emails.findOne({
    where: { id: parseInt(id) }
  });
  if (!emailObject) throw new Error(RESOURCE_NOT_FOUND);
  const email = emailObject.email;
  const user = await prisma.users.findOne({
    where: { id: emailObject.userId }
  });
  if (!user) throw new Error(USER_NOT_FOUND);
  await mail(email, Templates.EMAIL_VERIFY, { name: user.name, email, token });
  return;
};
