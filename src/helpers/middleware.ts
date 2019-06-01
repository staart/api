import { Request, Response, NextFunction } from "express";
import Brute from "express-brute";
import { safeError } from "./errors";
import { verifyToken } from "./jwt";
import { ErrorCode, Tokens } from "../interfaces/enum";
import { BRUTE_LIFETIME, BRUTE_FREE_RETRIES } from "../config";
const store = new Brute.MemoryStore();
const bruteForce = new Brute(store, {
  freeRetries: BRUTE_FREE_RETRIES,
  lifetime: BRUTE_LIFETIME
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
  try {
    res.locals.token = await verifyToken(token, Tokens.LOGIN);
    next();
  } catch (e) {
    const error = safeError(ErrorCode.INVALID_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
};

/**
 * Brute force middleware
 */
export const bruteForceHandler = bruteForce.prevent;
