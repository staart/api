import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import { sendPasswordReset } from "../rest/auth";

export const routeAuthResetPassword = async (req: Request, res: Response) => {
  const email = req.body && req.body.email;
  if (!email) throw new Error(ErrorCode.MISSING_FIELD);
  res.json({ queued: true });
  return await sendPasswordReset(email);
};
