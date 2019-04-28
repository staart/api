import { Request, Response } from "express";
import { register } from "../rest/auth";
import { getUserFromId } from "../rest/user";
import { ErrorCode } from "../interfaces/enum";

export const routeUserId = async (req: Request, res: Response) => {
  let id = req.body.id || req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json({ user: await getUserFromId(id, res.locals.token.id) });
};

export const routeUserPut = async (req: Request, res: Response) => {
  const user = req.body;
  const email = user.email;
  delete user.email;
  const users = await register(user, email);
  res.json({ success: true, users });
};
