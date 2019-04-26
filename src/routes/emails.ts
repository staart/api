import { Request, Response } from "express";
import { verifyEmail } from "../rest/auth";

export const routeEmailVerify = async (req: Request, res: Response) => {
  await verifyEmail(req.body.token || req.params.token, res.locals);
  res.json({ success: true });
};
