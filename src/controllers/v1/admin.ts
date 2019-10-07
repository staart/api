import { Request, Response } from "express";
import { MISSING_FIELD } from "@staart/errors";
import {
  getAllOrganizationForUser,
  getAllUsersForUser,
  getServerLogsForUser
} from "../../rest/admin";
import {
  Get,
  Controller,
  ClassMiddleware,
  ClassWrapper
} from "@overnightjs/core";
import { authHandler } from "../../helpers/middleware";
import asyncHandler from "express-async-handler";

@Controller("v1/admin")
@ClassMiddleware(authHandler)
@ClassWrapper(asyncHandler)
export class AdminController {
  @Get("organizations")
  async getOrganizations(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    res.json(await getAllOrganizationForUser(userId, req.query));
  }

  @Get("users")
  async getUsers(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    res.json(await getAllUsersForUser(userId, req.query));
  }

  @Get("server-logs")
  async getServerLogs(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    res.json(await getServerLogsForUser(userId, req.query));
  }

  @Get("info")
  async info(req: Request, res: Response) {
    res.json({
      success: true,
      message: "admin-info-success"
    });
  }
}
