import { Request, Response, NextFunction, RequestHandler } from "express";
import Brute from "express-brute";
import RateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import Joi from "@hapi/joi";
import { safeError } from "./errors";
import {
  verifyToken,
  TokenResponse,
  checkInvalidatedToken,
  ApiKeyResponse,
  checkIpRestrictions,
  checkReferrerRestrictions
} from "./jwt";
import { ErrorCode, Tokens } from "../interfaces/enum";
import {
  BRUTE_LIFETIME,
  BRUTE_FREE_RETRIES,
  RATE_LIMIT_MAX,
  RATE_LIMIT_TIME,
  SPEED_LIMIT_DELAY,
  SPEED_LIMIT_COUNT,
  SPEED_LIMIT_TIME,
  PUBLIC_RATE_LIMIT_TIME,
  PUBLIC_RATE_LIMIT_MAX
} from "../config";
import { ApiKey } from "../interfaces/tables/organization";
import { joiValidate, includesDomainInCommaList } from "./utils";
const store = new Brute.MemoryStore();
const bruteForce = new Brute(store, {
  freeRetries: BRUTE_FREE_RETRIES,
  lifetime: BRUTE_LIFETIME
});
const rateLimiter = RateLimit({
  windowMs: RATE_LIMIT_TIME,
  max: RATE_LIMIT_MAX
});
const publicRateLimiter = RateLimit({
  windowMs: PUBLIC_RATE_LIMIT_TIME,
  max: PUBLIC_RATE_LIMIT_MAX
});
const speedLimiter = slowDown({
  windowMs: SPEED_LIMIT_TIME,
  delayAfter: SPEED_LIMIT_COUNT,
  delayMs: SPEED_LIMIT_DELAY
});

/**
 * Handle any errors for Express
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.api_error_code) {
    // Handle Chargebee errors
    error = error.message;
  }
  const response = safeError(error.toString().replace("Error: ", ""));
  res.status(response.status);
  res.json({ error: response.code, message: response.message });
};

/**
 * Add locals for IP address and user agent
 */
export const trackingHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.userAgent = req.get("User-Agent");
  let ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
  if (ip === "::1") ip = "2001:67c:2564:a309:f0e0:1ee6:137b:29e8";
  res.locals.ipAddress = ip;
  res.locals.referrer = req.headers.referer as string;
  next();
};

export interface ApiKeyToken {
  type: string;
  apiKey: ApiKey;
}

/**
 * Add locals for a user after verifying their token
 */
export const authHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let userJwt = req.get("Authorization");
    if (userJwt) {
      if (userJwt.startsWith("Bearer "))
        userJwt = userJwt.replace("Bearer ", "");
      const userToken = (await verifyToken(
        userJwt,
        Tokens.LOGIN
      )) as TokenResponse;
      await checkInvalidatedToken(userJwt);
      if (userToken) res.locals.token = userToken;
    }

    let apiKeyJwt = req.get("X-Api-Key");
    if (apiKeyJwt) {
      if (apiKeyJwt.startsWith("Bearer "))
        apiKeyJwt = apiKeyJwt.replace("Bearer ", "");
      const apiKeyToken = (await verifyToken(
        apiKeyJwt,
        Tokens.API_KEY
      )) as ApiKeyResponse;
      await checkInvalidatedToken(apiKeyJwt);
      checkIpRestrictions(apiKeyToken, res.locals);
      const origin = req.get("Origin");
      if (origin) {
        const referrerDomain = new URL(origin).hostname;
        checkReferrerRestrictions(apiKeyToken, referrerDomain);
        if (apiKeyToken.referrerRestrictions) {
          if (
            includesDomainInCommaList(
              apiKeyToken.referrerRestrictions,
              referrerDomain
            )
          ) {
            res.setHeader("Access-Control-Allow-Origin", origin);
          }
        } else {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
      }
      if (apiKeyToken && !res.locals.token) res.locals.token = apiKeyToken;
    }
  } catch (error) {
    const jwtError = safeError(error);
    res.status(jwtError.status);
    return res.json(jwtError);
  }

  if (res.locals.token) return next();
  const error = safeError(ErrorCode.MISSING_TOKEN);
  res.status(error.status);
  return res.json(error);
};

/**
 * Brute force middleware
 */
export const bruteForceHandler = bruteForce.prevent;

/**
 * Rate limiting middleware
 */
export const rateLimitHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.get("X-Api-Key");
  if (apiKey) {
    try {
      const details = (await verifyToken(
        apiKey,
        Tokens.API_KEY
      )) as ApiKeyResponse;
      if (details.organizationId) {
        res.setHeader("X-Rate-Limit-Type", "api-key");
        return rateLimiter(req, res, next);
      }
    } catch (error) {}
  }
  res.setHeader("X-RateLimit-Limit-Type", "public");
  return publicRateLimiter(req, res, next);
};

/**
 * Speed limiting middleware
 */
export const speedLimitHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.get("X-Api-Key");
  if (apiKey) {
    try {
      const details = (await verifyToken(
        apiKey,
        Tokens.API_KEY
      )) as ApiKeyResponse;
      if (details.organizationId) {
        res.setHeader("X-Rate-Limit-Type", "api-key");
        return next();
      }
    } catch (error) {}
  }
  return speedLimiter(req, res, next);
};

export const validator = (
  schemaMap: Joi.SchemaMap,
  type: "body" | "params" | "query"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let data: any;
    switch (type) {
      case "params":
        data = req.params;
        break;
      case "query":
        data = req.query;
        break;
      default:
        data = req.body;
        break;
    }
    joiValidate(schemaMap, data);
    next();
  };
};
