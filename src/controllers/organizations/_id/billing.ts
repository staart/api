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
  organizationUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  getOrganizationBillingForUser,
  getOrganizationPricingPlansForUser,
  updateOrganizationBillingForUser,
} from "../../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationBillingController {
  @Get()
  async getBilling(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    return getOrganizationBillingForUser(
      localsToTokenOrKey(res),
      organizationId
    );
  }

  @Patch()
  async patchBilling(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    await updateOrganizationBillingForUser(
      localsToTokenOrKey(res),
      organizationId,
      req.body,
      res.locals
    );
    return { success: true, message: "organization-billing-updated" };
  }

  @Get("pricing")
  async getPlans(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.string().required(),
      },
      { organizationId }
    );
    return getOrganizationPricingPlansForUser(
      localsToTokenOrKey(res),
      organizationId
    );
  }
}
