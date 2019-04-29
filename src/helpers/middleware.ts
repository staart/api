import { Request, Response, NextFunction } from "express";
import { safeError, sendError } from "./errors";
import { verifyToken } from "./jwt";
import { ErrorCode, Tokens } from "../interfaces/enum";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(JSON.stringify(error));
  const response = safeError(error.toString().replace("Error: ", ""));
  res.status(response.status);
  res.json({ error: response.code, message: response.message });
};

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

export const authHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.get("Authorization") || req.get("X-Api-Key");
  if (!token) {
    const error = sendError(ErrorCode.MISSING_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
  if (token.startsWith("Bearer ")) token = token.replace("Bearer ", "");
  try {
    res.locals.token = await verifyToken(token, Tokens.LOGIN);
    next();
  } catch (e) {
    const error = sendError(ErrorCode.INVALID_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
};
