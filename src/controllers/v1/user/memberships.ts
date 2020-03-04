import { getMembershipsForUser } from "../../../rest/user";
import {
  Get,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response
} from "@staart/server";
import { authHandler } from "../../../helpers/middleware";
import { respond, RESOURCE_UPDATED, RESOURCE_DELETED } from "@staart/messages";
import { userUsernameToId } from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";
import {
  deleteMembershipForUser,
  getMembershipDetailsForUser,
  updateMembershipForUser
} from "../../../rest/membership";

@Controller(":id/memberships")
@ClassMiddleware(authHandler)
export class UserMembershipsController {
  @Get()
  async getMemberships(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getMembershipsForUser(res.locals.token.id, id, req.query);
  }

  @Get(":membershipId")
  async getMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { id, membershipId }
    );
    return await getMembershipDetailsForUser(id, membershipId);
  }

  @Delete(":membershipId")
  async deleteMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required()
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
        membershipId: Joi.string().required()
      },
      { id, membershipId }
    );
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(id, membershipId, data, res.locals);
    return respond(RESOURCE_UPDATED);
  }
}
