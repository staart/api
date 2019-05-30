import { sign, verify } from "jsonwebtoken";
import {
  JWT_ISSUER,
  JWT_SECRET,
  TOKEN_EXPIRY_EMAIL_VERIFICATION,
  TOKEN_EXPIRY_PASSWORD_RESET,
  TOKEN_EXPIRY_LOGIN,
  TOKEN_EXPIRY_REFRESH,
  TOKEN_EXPIRY_APPROVE_LOCATION
} from "../config";
import { User } from "../interfaces/tables/user";
import { Tokens, ErrorCode, EventType, Templates } from "../interfaces/enum";
import { deleteSensitiveInfoUser } from "./utils";
import { checkApprovedLocation } from "../crud/user";
import { Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import { getUserVerifiedEmails, getUserPrimaryEmail } from "../crud/email";
import { mail } from "./mail";

/**
 * Generate a new JWT
 */
export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: string | number,
  subject: string
) =>
  new Promise((resolve, reject) => {
    sign(
      // Payload is expected to be a plain object
      JSON.parse(JSON.stringify(payload)),
      JWT_SECRET,
      {
        expiresIn,
        subject,
        issuer: JWT_ISSUER
      },
      (error, token) => {
        if (error) return reject(error);
        resolve(token);
      }
    );
  });

/**
 * Verify a JWT
 */
export const verifyToken = (token: string, subject: string) =>
  new Promise((resolve, reject) => {
    verify(token, JWT_SECRET, { subject }, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });

/**
 * Generate a new email verification JWT
 */
export const emailVerificationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_EMAIL_VERIFICATION, Tokens.EMAIL_VERIFY);

/**
 * Generate a new password reset JWT
 */
export const passwordResetToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_PASSWORD_RESET, Tokens.PASSWORD_RESET);

/**
 * Generate a new login JWT
 */
export const loginToken = (user: User) =>
  generateToken(user, TOKEN_EXPIRY_LOGIN, Tokens.LOGIN);

/**
 * Generate a new 2FA JWT
 */
export const twoFactorToken = (user: User) =>
  generateToken({ userId: user.id }, TOKEN_EXPIRY_LOGIN, Tokens.TWO_FACTOR);

/**
 * Generate a new approve location JWT
 */
export const approveLocationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_APPROVE_LOCATION, Tokens.APPROVE_LOCATION);

/**
 * Generate a new refresh JWT
 */
export const refreshToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_REFRESH, Tokens.REFRESH);

export const postLoginTokens = async (user: User) => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  return {
    token: await loginToken(deleteSensitiveInfoUser(user)),
    refresh: await refreshToken(user.id)
  };
};

/**
 * Get the token response after logging in a user
 */
export const getLoginResponse = async (
  user: User,
  type?: EventType,
  strategy?: string,
  locals?: Locals
) => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const verifiedEmails = await getUserVerifiedEmails(user);
  if (!verifiedEmails.length) throw new Error(ErrorCode.UNVERIFIED_EMAIL);
  if (locals) {
    if (!(await checkApprovedLocation(user.id, locals.ipAddress))) {
      await mail(
        await getUserPrimaryEmail(user),
        Templates.UNAPPROVED_LOCATION,
        {
          ...user,
          token: await approveLocationToken(user.id)
        }
      );
      throw new Error(ErrorCode.UNAPPROVED_LOCATION);
    }
  }
  if (type && strategy && locals)
    await createEvent(
      {
        userId: user.id,
        type,
        data: { strategy }
      },
      locals
    );
  if (user.twoFactorEnabled)
    return {
      twoFactorToken: await twoFactorToken(user)
    };
  return await postLoginTokens(user);
};
