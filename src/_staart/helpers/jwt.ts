import {
  accessTokensCreateInput,
  accessTokensUpdateInput,
  users,
} from "@prisma/client";
import {
  IP_RANGE_CHECK_FAIL,
  REFERRER_CHECK_FAIL,
  REVOKED_TOKEN,
  UNAPPROVED_LOCATION,
  UNVERIFIED_EMAIL,
  USER_NOT_FOUND,
} from "@staart/errors";
import { redis } from "@staart/redis";
import { ipRangeCheck, randomString } from "@staart/text";
import { decode, sign, verify } from "jsonwebtoken";
import {
  JWT_ISSUER,
  JWT_SECRET,
  TOKEN_EXPIRY_API_KEY_MAX,
  TOKEN_EXPIRY_APPROVE_LOCATION,
  TOKEN_EXPIRY_EMAIL_VERIFICATION,
  TOKEN_EXPIRY_LOGIN,
  TOKEN_EXPIRY_PASSWORD_RESET,
  TOKEN_EXPIRY_REFRESH,
} from "../../config";
import { EventType, Templates, Tokens } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import {
  checkApprovedLocation,
  getUserPrimaryEmail,
  updateSessionByJwt,
} from "../services/user.service";
import { getGeolocationFromIp } from "./location";
import { mail } from "./mail";
import { prisma } from "./prisma";
import {
  deleteSensitiveInfoUser,
  includesDomainInCommaList,
  removeFalsyValues,
} from "./utils";

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
        jwtid: randomString({ length: 12 }),
      },
      (error, token) => {
        if (error) return reject(error);
        resolve(token);
      }
    );
  });

export interface TokenResponse {
  id: number;
  ipAddress?: string;
}
export interface ApiKeyResponse {
  id: number;
  groupId: string;
  scopes: string;
  jti: string;
  sub: Tokens.API_KEY;
  exp: number;
  ipRestrictions?: string;
  referrerRestrictions?: string;
}
export interface AccessTokenResponse {
  id: number;
  userId: string;
  scopes: string;
  jti: string;
  sub: Tokens.ACCESS_TOKEN;
  exp: number;
}

/**
 * Verify a JWT
 */
export const verifyToken = <T>(token: string, subject: Tokens): Promise<T> =>
  new Promise((resolve, reject) => {
    verify(token, JWT_SECRET, { subject }, (error, data) => {
      if (error) return reject(error);
      resolve((data as any) as T);
    });
  });

/**
 * Generate a new coupon JWT
 */
export const couponCodeJwt = (
  amount: number,
  currency: string,
  description?: string,
  expiresAt?: string
) =>
  generateToken(
    { amount, currency, description },
    expiresAt
      ? (new Date(expiresAt).getTime() - new Date().getTime()) / 1000
      : "30d",
    Tokens.COUPON
  );

/**
 * Generate a new email verification JWT
 */
export const emailVerificationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_EMAIL_VERIFICATION, Tokens.EMAIL_VERIFY);

/**
 * Generate a new email verification JWT
 */
export const resendEmailVerificationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_EMAIL_VERIFICATION, Tokens.EMAIL_RESEND);

/**
 * Generate a new password reset JWT
 */
export const passwordResetToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_PASSWORD_RESET, Tokens.PASSWORD_RESET);

/**
 * Generate a new login JWT
 */
export const loginToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_LOGIN, Tokens.LOGIN);

/**
 * Generate a new login link JWT
 */
export const loginLinkToken = (user: users) =>
  generateToken({ id: user.id }, TOKEN_EXPIRY_LOGIN, Tokens.LOGIN_LINK);

/**
 * Generate a new 2FA JWT
 */
export const twoFactorToken = (user: users) =>
  generateToken({ id: user.id }, TOKEN_EXPIRY_LOGIN, Tokens.TWO_FACTOR);

/**
 * Generate an access token
 */
export const accessToken = (
  accessToken: accessTokensCreateInput | accessTokensUpdateInput
) => {
  const createAccessToken = { ...removeFalsyValues(accessToken) };
  delete createAccessToken.createdAt;
  delete createAccessToken.accessToken;
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

export const postLoginTokens = async (
  user: users,
  locals: Locals | any,
  refreshTokenString?: string
) => {
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const refresh = await refreshToken(user.id);
  if (!refreshTokenString) {
    let token = refresh;
    try {
      const decoded = decode(refresh);
      if (decoded && typeof decoded === "object" && decoded.jti) {
        token = decoded.jti;
      }
    } catch (error) {}
    await prisma.sessions.create({
      data: {
        token,
        ipAddress: locals.ipAddress || "unknown-ip-address",
        userAgent: locals.userAgent || "unknown-user-agent",
        user: { connect: { id: user.id } },
      },
    });
  } else {
    await updateSessionByJwt(user.id, refreshTokenString, {});
  }
  return {
    token: await loginToken(user.id),
    refresh: !refreshTokenString ? refresh : undefined,
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
  user: users,
  type: EventType,
  strategy: string,
  locals: Locals | any
): Promise<LoginResponse> => {
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const verifiedEmails = await prisma.emails.findMany({
    where: { userId: user.id, isVerified: true },
  });
  if (!verifiedEmails.length) throw new Error(UNVERIFIED_EMAIL);
  if (locals) {
    if (!(await checkApprovedLocation(user.id, locals.ipAddress))) {
      const location = await getGeolocationFromIp(locals.ipAddress);
      await mail({
        to: (await getUserPrimaryEmail(user.id)).email,
        template: Templates.UNAPPROVED_LOCATION,
        data: {
          ...user,
          location: location
            ? location.city || location.region_name || location.country_code
            : "Unknown location",
          token: await approveLocationToken(user.id, locals.ipAddress),
        },
      });
      throw new Error(UNAPPROVED_LOCATION);
    }
  }
  if (user.twoFactorEnabled)
    return {
      twoFactorToken: await twoFactorToken(user),
    };
  return postLoginTokens(user, locals);
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
    throw new Error(REVOKED_TOKEN);
};

/**
 * Invalidate a JWT using Redis
 * @param token - JWT
 */
export const invalidateToken = async (token: string) => {
  if (!redis) return;
  const details = decode(token);
  if (details && typeof details === "object" && details.jti)
    await redis.set(
      `${JWT_ISSUER}-revoke-${details.sub}-${details.jti}`,
      "1",
      details.exp && [
        "EX",
        Math.floor((details.exp - new Date().getTime()) / 1000),
      ]
    );
};

export const checkIpRestrictions = (
  apiKey: ApiKeyResponse,
  locals: Locals | any
) => {
  if (!apiKey.ipRestrictions) return;
  if (
    !ipRangeCheck(
      locals.ipAddress,
      apiKey.ipRestrictions.split(",").map((range) => range.trim())
    )
  )
    throw new Error(IP_RANGE_CHECK_FAIL);
};

export const checkReferrerRestrictions = (
  apiKey: ApiKeyResponse,
  domain: string
) => {
  if (!apiKey.referrerRestrictions || !domain) return;
  if (!includesDomainInCommaList(apiKey.referrerRestrictions, domain))
    throw new Error(REFERRER_CHECK_FAIL);
};
