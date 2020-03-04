import {
  getOrganizationBillingForUser,
  updateOrganizationBillingForUser,
  getOrganizationPricingPlansForUser
} from "../../../rest/organization";
import {
  Get,
  Patch,
  Controller,
  ClassMiddleware,
  Request,
  Response
} from "@staart/server";
import { authHandler } from "../../../helpers/middleware";
import {
  organizationUsernameToId,
  localsToTokenOrKey
} from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

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
    return await getOrganizationBillingForUser(
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
        organizationId: Joi.string().required()
      },
      { organizationId }
    );
    return await getOrganizationPricingPlansForUser(
      localsToTokenOrKey(res),
      organizationId
    );
  }
}
