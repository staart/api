import { Request, Response } from "express";
import {
  getUserFromId,
  updateUserForUser,
  getAllDataForUser,
  getRecentEventsForUser,
  deleteUserForUser,
  getMembershipsForUser,
  getApiKeysForUser,
  createApiKeyForUser,
  getApiKeyForUser,
  updateApiKeyForUser,
  deleteApiKeyForUser,
  getNotificationsForUser
} from "../rest/user";
import { ErrorCode } from "../interfaces/enum";
import {
  Get,
  Post,
  Put,
  Delete,
  Middleware,
  Controller
} from "@overnightjs/core";

const routeUserId = async (req: Request, res: Response) => {
  let id = req.body.id || req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getUserFromId(id, res.locals.token.id));
};

const routeUserUpdate = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
  res.json({ success: true });
};

const routeUserRecentEvents = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getRecentEventsForUser(res.locals.token.id, id));
};
const routeUserMemberships = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getMembershipsForUser(res.locals.token.id, id));
};

const routeUserAllData = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getAllDataForUser(res.locals.token.id, id));
};

const routeUserDelete = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await deleteUserForUser(res.locals.token.id, id, res.locals));
};

const routeUserApiKeysGet = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getApiKeysForUser(res.locals.token.id, id));
};

const routeUserApiKeysPut = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await createApiKeyForUser(res.locals.token.id, id, res.locals));
};

const routeUserApiKeyGet = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  const apiKey = req.params.apiKey;
  if (!id || !apiKey) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getApiKeyForUser(res.locals.token.id, id, apiKey));
};

const routeUserApiKeyUpdate = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  const apiKey = req.params.apiKey;
  if (!id || !apiKey) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(
    await updateApiKeyForUser(
      res.locals.token.id,
      id,
      apiKey,
      req.body,
      res.locals
    )
  );
};

const routeUserApiKeyDelete = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  const apiKey = req.params.apiKey;
  if (!id || !apiKey) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(
    await deleteApiKeyForUser(res.locals.token.id, id, apiKey, res.locals)
  );
};

const routeUserNotificationsGet = async (req: Request, res: Response) => {
  let id = req.params.id;
  if (id === "me") id = res.locals.token.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getNotificationsForUser(res.locals.token.id, id));
};

@Controller("user")
export class UserController {
  @Get(":id")
  get(req: Request, res: Response) {
    console.log(req.params.id);
    res.status(200).json({ msg: "get_called" });
  }
}
