import {
  getOrganizationMembershipsForUser,
  inviteMemberToOrganization,
  getOrganizationMembershipForUser,
  deleteOrganizationMembershipForUser,
  updateOrganizationMembershipForUser
} from "../../../rest/organization";
import {
  RESOURCE_CREATED,
  respond,
  RESOURCE_UPDATED,
  RESOURCE_DELETED
} from "@staart/messages";
import {
  Get,
  Put,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response,
  Middleware
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import { MembershipRole } from "../../../interfaces/enum";
import {
  organizationUsernameToId,
  localsToTokenOrKey
} from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

@Controller(":id/memberships")
@ClassMiddleware(authHandler)
export class OrganizationMembershipsController {
  @Get()
  async getMemberships(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    return await getOrganizationMembershipsForUser(
      localsToTokenOrKey(res),
      organizationId,
      req.query
    );
  }

  @Put()
  async putMemberships(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const newMemberName = req.body.name;
    const newMemberEmail = req.body.email;
    const role = req.body.role;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        newMemberName: Joi.string()
          .min(6)
          .required(),
        newMemberEmail: Joi.string()
          .email()
          .required(),
        role: Joi.number()
      },
      {
        organizationId,
        newMemberName,
        newMemberEmail,
        role
      }
    );
    await inviteMemberToOrganization(
      localsToTokenOrKey(res),
      organizationId,
      newMemberName,
      newMemberEmail,
      role || MembershipRole.MEMBER,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":membershipId")
  async getMembership(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { organizationId, membershipId }
    );
    return await getOrganizationMembershipForUser(
      localsToTokenOrKey(res),
      organizationId,
      membershipId
    );
  }

  @Patch(":membershipId")
  @Middleware(
    validator(
      {
        role: Joi.number()
          .min(1)
          .max(5)
      },
      "body"
    )
  )
  async updateMembership(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { organizationId, membershipId }
    );
    await updateOrganizationMembershipForUser(
      localsToTokenOrKey(res),
      organizationId,
      membershipId,
      req.body
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":membershipId")
  async deleteMembership(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { organizationId, membershipId }
    );
    await deleteOrganizationMembershipForUser(
      localsToTokenOrKey(res),
      organizationId,
      membershipId
    );
    return respond(RESOURCE_DELETED);
  }
}
