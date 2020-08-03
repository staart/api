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
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  getGroupInvoiceForUser,
  getGroupInvoicesForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupInvoicesController {
  @Get()
  async getInvoices(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
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
    return getGroupInvoicesForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionParams
    );
  }

  @Get(":invoiceId")
  async getInvoice(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    const invoiceId = req.params.invoiceId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        invoiceId: Joi.string().required(),
      },
      { groupId, invoiceId }
    );
    return getGroupInvoiceForUser(localsToTokenOrKey(res), groupId, invoiceId);
  }
}
