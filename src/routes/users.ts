import { Request, Response } from "express";
import {
  getUserFromId,
  updateUserForUser,
  getAllDataForUser,
  getRecentEventsForUser
} from "../rest/user";
import { ErrorCode } from "../interfaces/enum";

export const routeUserId = async (req: Request, res: Response) => {
  let id = req.body.id || req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getUserFromId(id, res.locals.token.id));
};

export const routeUserUpdate = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
  res.json({ success: true });
};

export const routeUserRecentEvents = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getRecentEventsForUser(res.locals.token.id, id));
};

export const routeUserAllData = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getAllDataForUser(res.locals.token.id, id));
};
