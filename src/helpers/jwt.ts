import { sign, verify, decode } from "jsonwebtoken";
import {
  JWT_ISSUER,
  JWT_SECRET,
  TOKEN_EXPIRY_EMAIL_VERIFICATION,
  TOKEN_EXPIRY_PASSWORD_RESET,
  TOKEN_EXPIRY_LOGIN,
  TOKEN_EXPIRY_REFRESH,
  TOKEN_EXPIRY_APPROVE_LOCATION,
  TOKEN_EXPIRY_API_KEY_MAX
} from "../config";
import { User, AccessToken } from "../interfaces/tables/user";
import { Tokens, ErrorCode, EventType, Templates } from "../interfaces/enum";
import {
  deleteSensitiveInfoUser,
  removeFalsyValues,
  includesDomainInCommaList
} from "./utils";
import {
  checkApprovedLocation,
  createSession,
  updateSessionByJwt
} from "../crud/user";
import { Locals } from "../interfaces/general";
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
import ipRangeCheck from "ip-range-check";
import { redis } from "./redis";

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
  id: string;
  ipAddress?: string;
}
export interface ApiKeyResponse {
  id: string;
  organizationId: string;
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
export const emailVerificationToken = (id: string) =>
  generateToken({ id }, TOKEN_EXPIRY_EMAIL_VERIFICATION, Tokens.EMAIL_VERIFY);

/**
 * Generate a new password reset JWT
 */
export const passwordResetToken = (id: string) =>
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
    (apiKey.expiresAt
      ? new Date(apiKey.expiresAt).getTime()
      : TOKEN_EXPIRY_API_KEY_MAX) - new Date().getTime(),
    Tokens.API_KEY
  );
};
/**
 * Generate an access token
 */
export const accessToken = (accessToken: AccessToken) => {
  const createAccessToken = { ...removeFalsyValues(accessToken) };
  delete createAccessToken.createdAt;
  delete createAccessToken.jwtAccessToken;
  delete createAccessToken.updatedAt;
  delete createAccessToken.name;
  delete createAccessToken.description;
  delete createAccessToken.expiresAt;
  return generateToken(
    createAccessToken,
    (accessToken.expiresAt
      ? new Date(accessToken.expiresAt).getTime()
      : TOKEN_EXPIRY_API_KEY_MAX) - new Date().getTime(),
    Tokens.ACCESS_TOKEN
  );
};

/**
 * Generate a new approve location JWT
 */
export const approveLocationToken = (id: string, ipAddress: string) =>
  generateToken(
    { id, ipAddress },
    TOKEN_EXPIRY_APPROVE_LOCATION,
    Tokens.APPROVE_LOCATION
  );

/**
 * Generate a new refresh JWT
 */
export const refreshToken = (id: string) =>
  generateToken({ id }, TOKEN_EXPIRY_REFRESH, Tokens.REFRESH);

export const postLoginTokens = async (
  user: User,
  locals: Locals,
  refreshTokenString?: string
) => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const refresh = await refreshToken(user.id);
  if (!refreshTokenString) {
    await createSession({
      userId: user.id,
      jwtToken: refresh,
      ipAddress: locals.ipAddress || "unknown-ip-address",
      userAgent: locals.userAgent || "unknown-user-agent"
    });
  } else {
    await updateSessionByJwt(user.id, refreshTokenString, {});
  }
  return {
    token: await loginToken(
      deleteSensitiveInfoUser({
        ...user,
        email: await getUserBestEmail(user.id)
      })
    ),
    refresh: !refreshTokenString ? refresh : undefined
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
  type: EventType,
  strategy: string,
  locals: Locals
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
  if (user.twoFactorEnabled)
    return {
      twoFactorToken: await twoFactorToken(user)
    };
  return await postLoginTokens(user, locals);
};

/**
 * Check if a token is invalidated in Redis
 * @param token - JWT
 */
export const checkInvalidatedToken = async (token: string) => {
  if (!redis) return;
  const details = decode(token);
  if (
    details &&
    typeof details === "object" &&
    details.jti &&
    (await redis.get(`${JWT_ISSUER}-revoke-${details.sub}-${details.jti}`))
  )
    throw new Error(ErrorCode.REVOKED_TOKEN);
};

/**
 * Invalidate a JWT using Redis
 * @param token - JWT
 */
export const invalidateToken = async (token: string) => {
  if (!redis) return;
  const details = decode(token);
  if (details && typeof details === "object" && details.jti)
    redis.set(
      `${JWT_ISSUER}-revoke-${details.sub}-${details.jti}`,
      "1",
      details.exp && [
        "EX",
        Math.floor((details.exp - new Date().getTime()) / 1000)
      ]
    );
};

export const checkIpRestrictions = (apiKey: ApiKeyResponse, locals: Locals) => {
  if (!apiKey.ipRestrictions) return;
  if (
    !ipRangeCheck(
      locals.ipAddress,
      apiKey.ipRestrictions.split(",").map(range => range.trim())
    )
  )
    throw new Error(ErrorCode.IP_RANGE_CHECK_FAIL);
};

export const checkReferrerRestrictions = (
  apiKey: ApiKeyResponse,
  domain: string
) => {
  if (!apiKey.referrerRestrictions || !domain) return;
  if (!includesDomainInCommaList(apiKey.referrerRestrictions, domain))
    throw new Error(ErrorCode.REFERRER_CHECK_FAIL);
};
