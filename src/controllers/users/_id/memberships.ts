import { RESOURCE_DELETED, RESOURCE_UPDATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Patch,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { userUsernameToId } from "../../../_staart/helpers/utils";
import {
  deleteMembershipForUser,
  getMembershipDetailsForUser,
  getMembershipsForUser,
  updateMembershipForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserMembershipsController {
  @Get()
  async getMemberships(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return getMembershipsForUser(res.locals.token.id, id, req.query);
  }

  @Get(":membershipId")
  async getMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { id, membershipId }
    );
    return getMembershipDetailsForUser(id, membershipId);
  }

  @Delete(":membershipId")
  async deleteMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { id, membershipId }
    );
    await deleteMembershipForUser(id, membershipId, res.locals);
    return respond(RESOURCE_DELETED);
  }

  @Patch(":membershipId")
  async updateMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { id, membershipId }
    );
    const data = req.body;
    delete req.body.id;
    const updated = await updateMembershipForUser(
      id,
      membershipId,
      data,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }
}
