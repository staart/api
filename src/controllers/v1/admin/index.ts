import { MISSING_FIELD } from "@staart/errors";
import {
  getAllOrganizationForUser,
  getAllUsersForUser,
  getServerLogsForUser
} from "../../../rest/admin";
import {
  Get,
  Controller,
  ClassMiddleware,
  Request,
  Response
} from "@staart/server";
import { authHandler } from "../../../helpers/middleware";

@Controller("admin")
@ClassMiddleware(authHandler)
export class AdminController {
  @Get("organizations")
  async getOrganizations(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return await getAllOrganizationForUser(userId, req.query);
  }

  @Get("users")
  async getUsers(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return await getAllUsersForUser(userId, req.query);
  }

  @Get("server-logs")
  async getServerLogs(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return await getServerLogsForUser(userId, req.query);
  }

  @Get("info")
  async info() {
    return {
      success: true,
      message: "admin-info-success"
    };
  }
}
