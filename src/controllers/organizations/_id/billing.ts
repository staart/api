import {
  ClassMiddleware,
  Controller,
  Get,
  Patch,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import {
  localsToTokenOrKey,
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  getOrganizationBillingForUser,
  getOrganizationPricingPlansForUser,
  updateOrganizationBillingForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class OrganizationBillingController {
  @Get()
  async getBilling(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    return getOrganizationBillingForUser(localsToTokenOrKey(res), groupId);
  }

  @Patch()
  async patchBilling(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    await updateOrganizationBillingForUser(
      localsToTokenOrKey(res),
      groupId,
      req.body,
      res.locals
    );
    return { success: true, message: "group-billing-updated" };
  }

  @Get("pricing")
  async getPlans(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.string().required(),
      },
      { groupId }
    );
    return getOrganizationPricingPlansForUser(localsToTokenOrKey(res), groupId);
  }
}
