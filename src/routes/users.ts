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
  Controller,
  ClassMiddleware
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";

@Controller("user")
@ClassMiddleware(authHandler)
export class UserController {
  @Get(":id")
  async get(req: Request, res: Response) {
    let id = req.body.id || req.params.id;
    console.log(id, "Locals are", res.locals);
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getUserFromId(id, res.locals.token.id));
  }

  @Post(":id")
  async patch(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
    res.json({ success: true });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await deleteUserForUser(res.locals.token.id, id, res.locals));
  }

  @Get(":id/recent-events")
  async getRecentEvents(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getRecentEventsForUser(res.locals.token.id, id));
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getMembershipsForUser(res.locals.token.id, id));
  }

  @Get(":id/data")
  async getUserData(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getAllDataForUser(res.locals.token.id, id));
  }

  @Get(":id/api-keys")
  async getUserApiKeys(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getApiKeysForUser(res.locals.token.id, id));
  }

  @Put(":id/api-keys")
  async putUserApiKeys(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await createApiKeyForUser(res.locals.token.id, id, res.locals));
  }

  @Get(":id/api-keys/:apiKey")
  async getUserApiKey(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const apiKey = req.params.apiKey;
    if (!id || !apiKey) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getApiKeyForUser(res.locals.token.id, id, apiKey));
  }

  @Post(":id/api-keys/:apiKey")
  async patchUserApiKey(req: Request, res: Response) {
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
  }

  @Delete(":id/api-keys/:apiKey")
  async deleteUserApiKey(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const apiKey = req.params.apiKey;
    if (!id || !apiKey) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await deleteApiKeyForUser(res.locals.token.id, id, apiKey, res.locals)
    );
  }

  @Get(":id/notifications")
  async getUserNotifications(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getNotificationsForUser(res.locals.token.id, id));
  }
}
