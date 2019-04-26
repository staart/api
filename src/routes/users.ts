import { Request, Response } from "express";
import { register } from "../rest/auth";

export const routeUserMe = async (req: Request, res: Response) => {
  const user = req.body;
  const email = user.email;
  delete user.email;
  const users = await register(user, email);
  res.json({ success: true, users });
};

export const routeUserPut = async (req: Request, res: Response) => {
  const user = req.body;
  const email = user.email;
  delete user.email;
  const users = await register(user, email);
  res.json({ success: true, users });
};
