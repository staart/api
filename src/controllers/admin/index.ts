import { MISSING_FIELD } from "@staart/errors";
import {
  ClassMiddleware,
  Controller,
  Get,
  Put,
  Middleware,
  Request,
  Response,
} from "@staart/server";
import { authHandler, validator } from "../../_staart/helpers/middleware";
import { Joi } from "@staart/validate";
import {
  getAllOrganizationForUser,
  getAllUsersForUser,
  getServerLogsForUser,
  generateCouponForUser,
  getPaymentEventsForUser,
} from "../../_staart/rest/admin";

@ClassMiddleware(authHandler)
export class AdminController {
  @Get("organizations")
  async getOrganizations(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getAllOrganizationForUser(userId, req.query);
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
