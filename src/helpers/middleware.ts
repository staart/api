import { Request, Response, NextFunction } from "express";
import { safeError, sendError } from "./errors";
import { verifyToken } from "./jwt";
import { ErrorCode } from "../interfaces/enum";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response = safeError(error.toString());
  res.status(response.status);
  res.json({ error: response.code, message: response.message });
};

export const trackingHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.userAgent = req.get("User-Agent");
  res.locals.ipAddress =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;
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
    res.locals.token = await verifyToken(token, "auth");
    next();
  } catch (e) {
    const error = sendError(ErrorCode.INVALID_TOKEN);
    res.status(error.status);
    return res.json(error);
  }
};
