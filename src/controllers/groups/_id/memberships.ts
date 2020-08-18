import { MembershipRole } from "@prisma/client";
import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Middleware,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  deleteGroupMembershipForUser,
  getGroupMembershipForUser,
  getGroupMembershipsForUser,
  inviteMemberToGroup,
  updateGroupMembershipForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupMembershipsController {
  @Get()
  async getMemberships(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    return getGroupMembershipsForUser(
      localsToTokenOrKey(res),
      groupId,
      req.query
    );
  }

  @Put()
  async putMemberships(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const newMemberName = req.body.name;
    const newMemberEmail = req.body.email;
    const role = req.body.role;
    joiValidate(
      {
        groupId: Joi.number().required(),
        newMemberName: Joi.string().min(6).required(),
        newMemberEmail: Joi.string().email().required(),
        role: Joi.number(),
      },
      {
        groupId,
        newMemberName,
        newMemberEmail,
        role,
      }
    );
    await inviteMemberToGroup(
      localsToTokenOrKey(res),
      groupId,
      newMemberName,
      newMemberEmail,
      role || MembershipRole.MEMBER,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":membershipId")
  async getMembership(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const membershipId = twtToId(req.params.membershipId);
    joiValidate(
      {
        groupId: Joi.number().required(),
        membershipId: Joi.number().required(),
      },
      { groupId, membershipId }
    );
    return getGroupMembershipForUser(
      localsToTokenOrKey(res),
      groupId,
      membershipId
    );
  }

  @Patch(":membershipId")
  @Middleware(
    validator(
      {
        role: Joi.string().allow("OWNER", "ADMIN", "RESELLER", "MEMBER").only(),
      },
      "body"
    )
  )
  async updateMembership(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const membershipId = twtToId(req.params.membershipId);
    joiValidate(
      {
        groupId: Joi.number().required(),
        membershipId: Joi.number().required(),
      },
      { groupId, membershipId }
    );
    const updated = await updateGroupMembershipForUser(
      localsToTokenOrKey(res),
      groupId,
      membershipId,
      req.body
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":membershipId")
  async deleteMembership(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const membershipId = twtToId(req.params.membershipId);
    joiValidate(
      {
        groupId: Joi.number().required(),
        membershipId: Joi.number().required(),
      },
      { groupId, membershipId }
    );
    await deleteGroupMembershipForUser(
      localsToTokenOrKey(res),
      groupId,
      membershipId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
