import {
  ClassMiddleware,
  Controller,
  Get,
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
  getOrganizationInvoiceForUser,
  getOrganizationInvoicesForUser,
} from "../../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationInvoicesController {
  @Get()
  async getInvoices(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    const subscriptionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        billing: Joi.string().valid("charge_automatically", "send_invoice"),
        itemsPerPage: Joi.number(),
        plan: Joi.string(),
        status: Joi.string(),
      },
      subscriptionParams
    );
    return getOrganizationInvoicesForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionParams
    );
  }

  @Get(":invoiceId")
  async getInvoice(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const invoiceId = req.params.invoiceId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        invoiceId: Joi.string().required(),
      },
      { organizationId, invoiceId }
    );
    return getOrganizationInvoiceForUser(
      localsToTokenOrKey(res),
      organizationId,
      invoiceId
    );
  }
}
