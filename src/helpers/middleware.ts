import { Request, Response, NextFunction } from "express";
import { HTTPError } from "../interfaces/general";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const response: HTTPError = safeError(error.toString());
  res.status(response.status);
  res.json({ error: response.code, message: response.message });
};

export const safeError = (error: string) => {
  const errorString = error.toString();
  if (errorString.startsWith("JsonWebTokenError"))
    return { status: 401, code: "invalid-token" };
  return { status: 500, code: "server-error" };
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
