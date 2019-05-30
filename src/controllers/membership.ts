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
  ClassMiddleware,
  ClassWrapper
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import asyncHandler from "express-async-handler";
import Joi from "@hapi/joi";
import { joiValidate } from "../helpers/utils";

@Controller("memberships")
@ClassWrapper(asyncHandler)
@ClassMiddleware(authHandler)
export class MembershipController {
  @Get(":id")
  async get(req: Request, res: Response) {
    const membershipId = req.params.id;
    const userId = res.locals.token.id;
    joiValidate(
      {
        membershipId: Joi.number().required(),
        userId: Joi.number().required()
      },
      { membershipId, userId }
    );
    res.json(await getMembershipDetailsForUser(userId, membershipId));
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const userId = res.locals.token.id;
    const membershipId = req.params.id;
    joiValidate(
      {
        membershipId: Joi.number().required(),
        userId: Joi.number().required()
      },
      { membershipId, userId }
    );
    await deleteMembershipForUser(userId, membershipId, res.locals);
    res.json({ deleted: true });
  }

  @Patch(":id")
  async patch(req: Request, res: Response) {
    const userId = res.locals.token.id;
    const membershipId = req.params.id;
    joiValidate(
      {
        membershipId: Joi.number().required(),
        userId: Joi.number().required()
      },
      { membershipId, userId }
    );
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(userId, membershipId, data, res.locals);
    res.json({ updated: true });
  }
}
