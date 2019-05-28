import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import {
  getMembershipDetailsForUser,
  inviteMemberToOrganization,
  deleteMembershipForUser,
  updateMembershipForUser
} from "../rest/membership";
import {
  Get,
  Patch,
  Put,
  Delete,
  Controller,
  ClassMiddleware
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import { CREATED } from "http-status-codes";

@Controller("membership")
@ClassMiddleware(authHandler)
export class MembershipController {
  @Put()
  async put(req: Request, res: Response) {
    const organizationId = req.params.organizationId;
    const newMemberName = req.body.name;
    const newMemberEmail = req.body.email;
    const role = req.body.role;
    if (!organizationId || !newMemberName || !newMemberEmail || !role)
      throw new Error(ErrorCode.MISSING_FIELD);
    await inviteMemberToOrganization(
      res.locals.token.id,
      organizationId,
      newMemberName,
      newMemberEmail,
      role,
      res.locals
    );
    res.status(CREATED).json({ invited: true });
  }

  @Get(":id")
  async get(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await getMembershipDetailsForUser(res.locals.token.id, id));
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const id = res.locals.token.id;
    const membershipId = req.params.id;
    if (!id || !membershipId) throw new Error(ErrorCode.MISSING_FIELD);
    await deleteMembershipForUser(id, membershipId, res.locals);
    res.json({ deleted: true });
  }

  @Patch(":id")
  async patch(req: Request, res: Response) {
    const userId = res.locals.token.id;
    const membershipId = req.params.id;
    if (!userId || !membershipId) throw new Error(ErrorCode.MISSING_FIELD);
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(userId, membershipId, data, res.locals);
    res.json({ updated: true });
  }
}
