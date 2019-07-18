import { sign, verify, decode } from "jsonwebtoken";
import {
  JWT_ISSUER,
  JWT_SECRET,
  TOKEN_EXPIRY_EMAIL_VERIFICATION,
  TOKEN_EXPIRY_PASSWORD_RESET,
  TOKEN_EXPIRY_LOGIN,
  TOKEN_EXPIRY_REFRESH,
  TOKEN_EXPIRY_APPROVE_LOCATION,
  TOKEN_EXPIRY_API_KEY_MAX,
  REDIS_URL
} from "../config";
import { User } from "../interfaces/tables/user";
import { Tokens, ErrorCode, EventType, Templates } from "../interfaces/enum";
import { deleteSensitiveInfoUser, removeFalsyValues } from "./utils";
import { checkApprovedLocation } from "../crud/user";
import { Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import {
  getUserVerifiedEmails,
  getUserPrimaryEmail,
  getUserBestEmail
} from "../crud/email";
import { mail } from "./mail";
import { getGeolocationFromIp } from "./location";
import i18n from "../i18n";
import { ApiKey } from "../interfaces/tables/organization";
import cryptoRandomString from "crypto-random-string";
import { createHandyClient } from "handy-redis";

/**
 * Generate a new JWT
 */
export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: string | number,
  subject: Tokens
): Promise<string> =>
  new Promise((resolve, reject) => {
    sign(
      // Payload is expected to be a plain object
      JSON.parse(JSON.stringify(payload)),
      JWT_SECRET,
      {
        expiresIn,
        subject,
        issuer: JWT_ISSUER,
        jwtid: cryptoRandomString({ length: 12 })
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
export interface TokenResponse {
  id: number;
  ipAddress?: string;
}
export interface ApiKeyResponse {
  id: number;
  organizationId: number;
  scopes: string;
  jti: string;
  sub: Tokens;
  exp: number;
  ipRestrictions?: string;
  referrerRestrictions?: string;
}
export const verifyToken = (
  token: string,
  subject: Tokens
): Promise<TokenResponse | ApiKeyResponse> =>
  new Promise((resolve, reject) => {
    verify(token, JWT_SECRET, { subject }, (error, data) => {
      if (error) return reject(error);
      resolve(data as TokenResponse | ApiKeyResponse);
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
  generateToken({ id: user.id }, TOKEN_EXPIRY_LOGIN, Tokens.TWO_FACTOR);

/**
 * Generate an API key JWT
 */
export const apiKeyToken = (apiKey: ApiKey) => {
  const createApiKey = { ...removeFalsyValues(apiKey) };
  delete createApiKey.createdAt;
  delete createApiKey.jwtApiKey;
  delete createApiKey.updatedAt;
  delete createApiKey.name;
  delete createApiKey.description;
  delete createApiKey.expiresAt;
  return generateToken(
    createApiKey,
    (apiKey.expiresAt ? apiKey.expiresAt.getTime() : TOKEN_EXPIRY_API_KEY_MAX) -
      new Date().getTime(),
    Tokens.API_KEY
  );
};

/**
 * Generate a new approve location JWT
 */
export const approveLocationToken = (id: number, ipAddress: string) =>
  generateToken(
    { id, ipAddress },
    TOKEN_EXPIRY_APPROVE_LOCATION,
    Tokens.APPROVE_LOCATION
  );

/**
 * Generate a new refresh JWT
 */
export const refreshToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_REFRESH, Tokens.REFRESH);

export const postLoginTokens = async (user: User) => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  return {
    token: await loginToken(
      deleteSensitiveInfoUser({
        ...user,
        email: await getUserBestEmail(user.id)
      })
    ),
    refresh: await refreshToken(user.id)
  };
};

export interface LoginResponse {
  twoFactorToken?: string;
  token?: string;
  refresh?: string;
  [index: string]: string | undefined;
}
/**
 * Get the token response after logging in a user
 */
export const getLoginResponse = async (
  user: User,
  type?: EventType,
  strategy?: string,
  locals?: Locals
): Promise<LoginResponse> => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const verifiedEmails = await getUserVerifiedEmails(user);
  if (!verifiedEmails.length) throw new Error(ErrorCode.UNVERIFIED_EMAIL);
  if (locals) {
    if (!(await checkApprovedLocation(user.id, locals.ipAddress))) {
      const location = await getGeolocationFromIp(locals.ipAddress);
      await mail(
        await getUserPrimaryEmail(user),
        Templates.UNAPPROVED_LOCATION,
        {
          ...user,
          location: location
            ? location.city || location.region_name || location.country_code
            : i18n.en.emails["unknown-location"],
          token: await approveLocationToken(user.id, locals.ipAddress)
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

const client = createHandyClient({
  url: REDIS_URL
});

/**
 * Check if a token is invalidated in Redis
 * @param token - JWT
 */
export const checkInvalidatedToken = async (token: string) => {
  const details = decode(token);
  if (
    details &&
    typeof details === "object" &&
    details.jti &&
    (await client.get(`${JWT_ISSUER}-revoke-${details.sub}-${details.jti}`))
  )
    throw new Error(ErrorCode.REVOKED_TOKEN);
};

/**
 * Invalidate a JWT using Redis
 * @param token - JWT
 */
export const invalidateToken = async (token: string) => {
  const details = decode(token);
  if (details && typeof details === "object" && details.jti)
    client.set(
      `${JWT_ISSUER}-revoke-${details.sub}-${details.jti}`,
      "1",
      details.exp && [
        "EX",
        Math.floor((details.exp - new Date().getTime()) / 1000)
      ]
    );
};
