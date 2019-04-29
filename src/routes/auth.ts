import { Request, Response } from "express";
import { ErrorCode, UserRole } from "../interfaces/enum";
import {
  sendPasswordReset,
  login,
  updatePassword,
  register,
  validateRefreshToken
} from "../rest/auth";
import { verifyToken } from "../helpers/jwt";

export const routeAuthVerifyToken = async (req: Request, res: Response) => {
  const token =
    req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
  const subject = req.body.subject;
  if (!token || !subject) throw new Error(ErrorCode.MISSING_FIELD);
  try {
    const data = await verifyToken(token, subject);
    res.json({ verified: true, data });
  } catch (error) {
    throw new Error(ErrorCode.INVALID_TOKEN);
  }
};

export const routeAuthLogin = async (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) throw new Error(ErrorCode.MISSING_FIELD);
  try {
    const tokens = await login(email, password, res.locals);
    res.json(tokens);
  } catch (error) {
    throw new Error(ErrorCode.INVALID_LOGIN);
  }
};

export const routeAuthRefresh = async (req: Request, res: Response) => {
  const token =
    req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
  if (!token) throw new Error(ErrorCode.MISSING_TOKEN);
  try {
    const tokens = await validateRefreshToken(token, res.locals);
    res.json(tokens);
  } catch (error) {
    throw new Error(ErrorCode.INVALID_TOKEN);
  }
};

export const routeAuthRegister = async (req: Request, res: Response) => {
  const email = req.body.email;
  const user = req.body;
  delete user.organizationId;
  delete user.email;
  if (user.role == UserRole.ADMIN) delete user.role;
  delete user.membershipRole;
  if (!req.body.name || !req.body.email)
    throw new Error(ErrorCode.MISSING_FIELD);
  await register(user, email, req.body.organizationId, req.body.membershipRole);
  res.json({ success: true });
};

export const routeAuthResetPasswordRequest = async (
  req: Request,
  res: Response
) => {
  const email = req.body && req.body.email;
  if (!email) throw new Error(ErrorCode.MISSING_FIELD);
  res.json({ queued: true });
  return await sendPasswordReset(email, res.locals);
};

export const routeAuthResetPasswordRecover = async (
  req: Request,
  res: Response
) => {
  const token =
    req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
  const password = req.body.password;
  if (!token || !password) throw new Error(ErrorCode.MISSING_FIELD);
  await updatePassword(token, password, res.locals);
  res.json({ success: true });
};
