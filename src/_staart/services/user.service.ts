import {
  accessTokens,
  accessTokensCreateInput,
  sessionsUpdateInput,
  users,
  usersCreateInput,
} from "@prisma/client";
import {
  MISSING_PRIMARY_EMAIL,
  RESOURCE_NOT_FOUND,
  USER_NOT_FOUND,
} from "@staart/errors";
import {
  anonymizeIpAddress,
  capitalizeFirstAndLastLetter,
  hash,
} from "@staart/text";
import { createHash } from "crypto";
import { decode } from "jsonwebtoken";
import randomInt from "random-int";
import { TOKEN_EXPIRY_API_KEY_MAX } from "../../config";
import {
  deleteItemFromCache,
  getItemFromCache,
  setItemInCache,
} from "../helpers/cache";
import { accessToken, emailVerificationToken } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { prisma } from "../helpers/prisma";
import { deleteSensitiveInfoUser } from "../helpers/utils";
import { Templates } from "../interfaces/enum";
import { KeyValue } from "../interfaces/general";
import { sendNewPassword } from "../rest/auth";

/**
 * Create a new user
 */
export const createUser = async (user: usersCreateInput) => {
  user.name = capitalizeFirstAndLastLetter(user.name);
  user.password = user.password ? await hash(user.password, 8) : null;
  user.profilePictureUrl =
    user.profilePictureUrl ||
    `https://api.adorable.io/avatars/285/${createHash("md5")
      .update(user.name)
      .digest("hex")}.png`;
  const result = await prisma.users.create({
    data: user,
  });
  return result;
};

/**
 * Get the details of a user by their email
 */
export const getUserByEmail = async (email: string, secureOrigin = false) => {
  const users = await prisma.users.findMany({
    where: {
      emails: {
        some: {
          email,
          isVerified: true,
        },
      },
    },
  });
  if (!users.length) throw new Error(USER_NOT_FOUND);
  if (!secureOrigin) return deleteSensitiveInfoUser(users[0]);
  return users[0];
};

/**
 * Update a user's details
 */
export const updateUser = async (id: number, user: KeyValue) => {
  const originalUser = await getUserById(id);
  await deleteItemFromCache(`cache_getUserById_${originalUser.id}`);
  if (user.password) user.password = await hash(user.password, 8);
  if (user.primaryEmail) {
    if ((originalUser.profilePictureUrl || "").includes("api.adorable.io")) {
      const emailDetails = await prisma.emails.findOne({
        where: { id: user.primaryEmail },
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
  const result = await prisma.users.update({
    data: user,
    where: { id: id },
  });
  return result;
};

/**
 * Add a new approved location for a user
 * @param ipAddress - IP address for the new location
 */
export const addApprovedLocation = async (
  userId: number,
  ipAddress: string
) => {
  const subnet = anonymizeIpAddress(ipAddress);
  return prisma.approvedLocations.create({
    data: {
      user: { connect: { id: userId } },
      subnet,
      createdAt: new Date(),
    },
  });
};

/**
 * Check whether a location is approved for a user
 * @param ipAddress - IP address for checking
 */
export const checkApprovedLocation = async (
  userId: number,
  ipAddress: string
) => {
  const user = await getUserById(userId);
  if (!user) throw new Error(USER_NOT_FOUND);
  if (!user.checkLocationOnLogin) return true;
  const subnet = anonymizeIpAddress(ipAddress);
  return (
    (
      await prisma.approvedLocations.findMany({
        where: { userId: userId, subnet },
      })
    ).length !== 0
  );
};

/**
 * Create 2FA backup codes for user
 * We generate 6-digit backup codes for a user
 * and save the hashed version in the database
 * @param count - Number of backup codes to create
 */
export const createBackupCodes = async (userId: number, count = 1) => {
  const now = new Date();
  const codes: string[] = [];
  for await (const _ of Array.from(Array(count).keys())) {
    const code = randomInt(100000, 999999).toString();
    codes.push(code);
    await prisma.backupCodes.create({
      data: {
        code: await hash(code, 8),
        user: { connect: { id: userId } },
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  return codes;
};

/**
 * Create an API key
 */
export const createAccessToken = async (data: accessTokensCreateInput) => {
  data.expiresAt = data.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
  data.accessToken = await accessToken(data);
  return prisma.accessTokens.create({ data });
};

/**
 * Update a user's details
 */
export const updateAccessToken = async (
  accessTokenId: number,
  data: accessTokens
) => {
  const newAccessToken = await prisma.accessTokens.findOne({
    where: { id: accessTokenId },
  });
  if (!newAccessToken) throw new Error(RESOURCE_NOT_FOUND);
  return prisma.accessTokens.update({
    data,
    where: { id: accessTokenId },
  });
};

/**
 * Delete an API key
 */
export const deleteAccessToken = async (accessTokenId: number) => {
  const currentAccessToken = await prisma.accessTokens.findOne({
    where: { id: accessTokenId },
  });
  if (!currentAccessToken) throw new Error(RESOURCE_NOT_FOUND);
  return prisma.accessTokens.delete({
    where: { id: accessTokenId },
  });
};

/**
 * Get the primary email of a user
 * @param userId - User Id
 */
export const getUserPrimaryEmail = async (userId: number) => {
  const prefersEmail = (
    await prisma.users.findOne({
      select: { prefersEmail: true },
      where: { id: userId },
    })
  )?.prefersEmail;
  if (!prefersEmail) throw new Error(MISSING_PRIMARY_EMAIL);
  return prefersEmail;
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
  try {
    const decoded = decode(sessionJwt);
    if (decoded && typeof decoded === "object" && decoded.jti) {
      sessionJwt = decoded.jti;
    }
  } catch (error) {}
  const currentSession = await prisma.sessions.findMany({
    where: { token: sessionJwt, userId },
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
  email: string,
  sendVerification = true,
  sendPasswordSet = false
) => {
  const result = await prisma.emails.create({
    data: { email, user: { connect: { id: userId } } },
  });
  if (sendVerification) {
    const user = await getUserById(userId);
    if (!user) throw new Error(USER_NOT_FOUND);
    await sendEmailVerification(result.id, email, user);
  }
  if (sendPasswordSet) await sendNewPassword(userId, email);
  return result;
};

/**
 * Send an email verification link
 */
export const sendEmailVerification = async (
  id: number,
  email: string,
  user: users
) => {
  const token = await emailVerificationToken(id);
  await mail({
    to: email,
    template: Templates.EMAIL_VERIFY,
    data: { name: user.name, email, token },
  });
  return;
};

/**
 * Resend an email verification link
 */
export const resendEmailVerification = async (id: number) => {
  const token = await emailVerificationToken(id);
  const emailObject = await prisma.emails.findOne({
    where: { id: id },
  });
  if (!emailObject) throw new Error(RESOURCE_NOT_FOUND);
  const email = emailObject.email;
  const user = await getUserById(emailObject.userId);
  if (!user) throw new Error(USER_NOT_FOUND);
  await mail({
    to: email,
    template: Templates.EMAIL_VERIFY,
    data: { name: user.name, email, token },
  });
  return;
};

/**
 * Get a user object from its ID
 * @param id - User ID
 */
export const getUserById = async (id: number) => {
  const key = `cache_getUserById_${id}`;
  try {
    return await getItemFromCache<users>(key);
  } catch (error) {
    const user = await prisma.users.findOne({ where: { id } });
    if (user) {
      await setItemInCache(key, user);
      return user;
    }
    throw new Error(USER_NOT_FOUND);
  }
};
