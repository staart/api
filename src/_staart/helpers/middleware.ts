import {
  INVALID_SIGNATURE,
  MISSING_SIGNATURE,
  MISSING_TOKEN,
} from "@staart/errors";
import { constructWebhookEvent } from "@staart/payments";
import {
  NextFunction,
  RateLimit,
  RawRequest,
  Request,
  Response,
  slowDown,
} from "@staart/server";
import { ms } from "@staart/text";
import { joiValidate, SchemaMap } from "@staart/validate";
import pkg from "../../../package.json";
import {
  BRUTE_FORCE_COUNT,
  BRUTE_FORCE_DELAY,
  BRUTE_FORCE_TIME,
  PUBLIC_RATE_LIMIT_MAX,
  PUBLIC_RATE_LIMIT_TIME,
  RATE_LIMIT_MAX,
  RATE_LIMIT_TIME,
  SPEED_LIMIT_COUNT,
  SPEED_LIMIT_DELAY,
  SPEED_LIMIT_TIME,
} from "../../config";
import { Tokens } from "../interfaces/enum";
import { StripeLocals, Locals } from "../interfaces/general";
import { safeError } from "./errors";
import {
  ApiKeyResponse,
  checkInvalidatedToken,
  checkIpRestrictions,
  checkReferrerRestrictions,
  TokenResponse,
  verifyToken,
} from "./jwt";
import { trackUrl } from "./tracking";
import { includesDomainInCommaList } from "./utils";

const bruteForce = slowDown({
  windowMs: BRUTE_FORCE_TIME,
  delayAfter: BRUTE_FORCE_COUNT,
  delayMs: BRUTE_FORCE_DELAY,
});
const rateLimiter = RateLimit({
  windowMs: RATE_LIMIT_TIME,
  max: RATE_LIMIT_MAX,
});
const publicRateLimiter = RateLimit({
  windowMs: PUBLIC_RATE_LIMIT_TIME,
  max: PUBLIC_RATE_LIMIT_MAX,
});
const speedLimiter = slowDown({
  windowMs: SPEED_LIMIT_TIME,
  delayAfter: SPEED_LIMIT_COUNT,
  delayMs: SPEED_LIMIT_DELAY,
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
  res.setHeader("X-Api-Version", pkg.version);
  let ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
  if (ip === "::1") ip = "2001:67c:2564:a309:f0e0:1ee6:137b:29e8";
  if (typeof ip === "string") ip = ip.split(",")[0];
  if (Array.isArray(ip) && ip.length) ip = ip[0];
  res.locals.ipAddress = ip;
  res.locals.referrer = req.headers.referer as string;
  trackUrl(req, res)
    .then(() => {})
    .then(() => {})
    .finally(() => next());
};

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
      const userToken = await verifyToken<TokenResponse>(userJwt, Tokens.LOGIN);
      await checkInvalidatedToken(userJwt);
      if (userToken) res.locals.token = userToken;
    }

    let apiKeyJwt = req.get("X-Api-Key") || req.query.key;
    if (typeof apiKeyJwt === "string") {
      if (apiKeyJwt.startsWith("Bearer "))
        apiKeyJwt = apiKeyJwt.replace("Bearer ", "");
      const apiKeyToken = await verifyToken<ApiKeyResponse>(
        apiKeyJwt,
        Tokens.API_KEY
      );
      await checkInvalidatedToken(apiKeyJwt);
      checkIpRestrictions(apiKeyToken, res.locals as Locals);
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
  const error = safeError(MISSING_TOKEN);
  res.status(error.status);
  return res.json(error);
};

/**
 * Brute force middleware
 */
export const bruteForceHandler = bruteForce;

/**
 * Rate limiting middleware
 */
export const rateLimitHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.get("X-Api-Key") || req.query.key;
  if (typeof apiKey === "string") {
    try {
      const details = await verifyToken<ApiKeyResponse>(apiKey, Tokens.API_KEY);
      if (details.groupId) {
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
  const apiKey = req.get("X-Api-Key") || req.query.key;
  if (typeof apiKey === "string") {
    try {
      const details = await verifyToken<ApiKeyResponse>(apiKey, Tokens.API_KEY);
      if (details.groupId) {
        res.setHeader("X-Rate-Limit-Type", "api-key");
        return next();
      }
    } catch (error) {}
  }
  return speedLimiter(req, res, next);
};

/**
 * Response caching middleware
 * @param time - Amount of time to cache contenr for
 */
export const cachedResponse = (time: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set(
      "Cache-Control",
      `max-age=${Math.floor(ms(time) / 1000)}, must-revalidate`
    );
    return next();
  };
};

export const validator = (
  schemaMap: SchemaMap,
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
    }
    joiValidate(schemaMap, data);
    next();
  };
};

/**
 * Handle Stripe's webhook authentication
 */
export const stripeWebhookAuthHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.get("stripe-signature");
  if (!signature) {
    const error = safeError(MISSING_SIGNATURE);
    res.status(error.status);
    return res.json(error);
  }
  try {
    const event = constructWebhookEvent((req as RawRequest).rawBody, signature);
    (res.locals as StripeLocals).stripeEvent = event;
    next();
  } catch (error) {
    console.log("Webhook error", error);
    const webhookError = safeError(INVALID_SIGNATURE);
    res.status(webhookError.status);
    return res.json(webhookError);
  }
};
