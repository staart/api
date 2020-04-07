import {
  ClassMiddleware,
  Controller,
  Get,
  Patch,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId,
} from "../../helpers/utils";
import {
  getOrganizationBillingForUser,
  getOrganizationPricingPlansForUser,
  updateOrganizationBillingForUser,
} from "../../rest/organization";

@Controller(":id")
@ClassMiddleware(authHandler)
export class OrganizationBillingController {
  @Get("billing")
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

  @Patch("billing")
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
