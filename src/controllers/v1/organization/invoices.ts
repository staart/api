import {
  getOrganizationInvoicesForUser,
  getOrganizationInvoiceForUser
} from "../../../rest/organization";
import {
  Get,
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

@Controller(":id/invoices")
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
        status: Joi.string()
      },
      subscriptionParams
    );
    return await getOrganizationInvoicesForUser(
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
        invoiceId: Joi.string().required()
      },
      { organizationId, invoiceId }
    );
    return await getOrganizationInvoiceForUser(
      localsToTokenOrKey(res),
      organizationId,
      invoiceId
    );
  }
}
