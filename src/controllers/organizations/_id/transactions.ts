import {
  ClassMiddleware,
  Controller,
  Get,
  Request,
  Response,
  Put,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  getOrganizationTransactionForUser,
  getOrganizationTransactionsForUser,
  applyCouponToOrganizationForUser,
} from "../../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationTransactionsController {
  @Get()
  async getTransactions(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    const transactionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      transactionParams
    );
    return getOrganizationTransactionsForUser(
      localsToTokenOrKey(res),
      organizationId,
      transactionParams
    );
  }

  @Put()
  async applyCoupon(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const couponCode = req.body.couponCode;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        couponCode: Joi.string().required(),
      },
      { organizationId, couponCode }
    );
    return applyCouponToOrganizationForUser(
      localsToTokenOrKey(res),
      organizationId,
      couponCode
    );
  }

  @Get(":transactionId")
  async getTransaction(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const transactionId = req.params.transactionId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        transactionId: Joi.string().required(),
      },
      { organizationId, transactionId }
    );
    return getOrganizationTransactionForUser(
      localsToTokenOrKey(res),
      organizationId,
      transactionId
    );
  }
}
