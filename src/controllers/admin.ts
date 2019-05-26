import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import { getAllOrganizationForUser, getAllUsersForUser } from "../rest/admin";
import { Get, Controller, ClassMiddleware } from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";

@Controller("admin")
@ClassMiddleware(authHandler)
export class AdminController {
  @Get("organizations")
  async getOrganizations(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getAllOrganizationForUser(userId));
  }

  @Get("users")
  async getUsers(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getAllUsersForUser(userId));
  }
}
