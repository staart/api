import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import { sendPasswordReset, login, updatePassword } from "../rest/auth";
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
    const token = await login(email, password, res.locals);
    res.json({ token });
  } catch (error) {
    throw new Error(ErrorCode.INVALID_LOGIN);
  }
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
