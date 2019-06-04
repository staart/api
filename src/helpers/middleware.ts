import { Request, Response, NextFunction } from "express";
import Brute from "express-brute";
import RateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { safeError } from "./errors";
import { verifyToken } from "./jwt";
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
import { getApiKey, getApiKeySecret } from "../crud/user";
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
  next();
};

/**
 * Add locals for a user after verifying their token
 */
export const authHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.get("Authorization") || req.get("X-Api-Key");
  if (!token) {
    const error = safeError(ErrorCode.MISSING_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
  if (token.startsWith("Bearer ")) token = token.replace("Bearer ", "");
  let localsToken;
  try {
    localsToken = await verifyToken(token, Tokens.LOGIN);
  } catch (e) {}
  const secretKey = req.get("X-Api-Secret");
  try {
    if (secretKey) {
      const apiKey = await getApiKeySecret(token, secretKey);
      if (apiKey.userId) {
        localsToken = { id: apiKey.userId };
      }
    }
  } catch (e) {}
  if (localsToken) {
    res.locals.token = localsToken;
    next();
  } else {
    const error = safeError(ErrorCode.INVALID_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
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
    const apiKeyDetails = await getApiKey(apiKey);
    if (apiKeyDetails.userId) {
      res.setHeader("X-RateLimit-Limit-Type", "api-key");
      return rateLimiter(req, res, next);
    }
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
    const apiKeyDetails = await getApiKey(apiKey);
    if (apiKeyDetails.userId) {
      // Don't slow down requests if an API key is used
      return next();
    }
  }
  return speedLimiter(req, res, next);
};
