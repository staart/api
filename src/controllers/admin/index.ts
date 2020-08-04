import { MISSING_FIELD } from "@staart/errors";
import { ClassMiddleware, Get, Request, Response } from "@staart/server";
import { authHandler } from "../../_staart/helpers/middleware";
import {
  getAllGroupForUser,
  getAllUsersForUser,
  getPaymentEventsForUser,
  getServerLogsForUser,
} from "../../_staart/rest/admin";

@ClassMiddleware(authHandler)
export class AdminController {
  @Get("groups")
  async getGroups(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getAllGroupForUser(userId, req.query);
  }

  @Get("users")
  async getUsers(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getAllUsersForUser(userId, req.query);
  }

  @Get("server-logs")
  async getServerLogs(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getServerLogsForUser(userId, req.query);
  }

  @Get("payment-events")
  async getPaymentEvents(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getPaymentEventsForUser(userId, req.query);
  }

  @Get("info")
  async info() {
    return {
      success: true,
      message: "admin-info-success",
    };
  }
}
