import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
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
import {
  localsToTokenOrKey,
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  deleteOrganizationMembershipForUser,
  getOrganizationMembershipForUser,
  getOrganizationMembershipsForUser,
  inviteMemberToOrganization,
  updateOrganizationMembershipForUser,
} from "../../../_staart/rest/group";
import { MembershipRole } from "@prisma/client";

@ClassMiddleware(authHandler)
export class OrganizationMembershipsController {
  @Get()
  async getMemberships(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    return getOrganizationMembershipsForUser(
      localsToTokenOrKey(res),
      groupId,
      req.query
    );
  }

  @Put()
  async putMemberships(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    const newMemberName = req.body.name;
    const newMemberEmail = req.body.email;
    const role = req.body.role;
    joiValidate(
      {
        groupId: Joi.string().required(),
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
    await inviteMemberToOrganization(
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
    const groupId = await groupUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { groupId, membershipId }
    );
    return getOrganizationMembershipForUser(
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
    const groupId = await groupUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { groupId, membershipId }
    );
    const updated = await updateOrganizationMembershipForUser(
      localsToTokenOrKey(res),
      groupId,
      membershipId,
      req.body
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":membershipId")
  async deleteMembership(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        membershipId: Joi.string().required(),
      },
      { groupId, membershipId }
    );
    await deleteOrganizationMembershipForUser(
      localsToTokenOrKey(res),
      groupId,
      membershipId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
