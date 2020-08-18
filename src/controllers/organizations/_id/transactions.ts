import { ClassMiddleware, Get, Put, Request, Response } from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  applyCouponToGroupForUser,
  getGroupTransactionForUser,
  getGroupTransactionsForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupTransactionsController {
  @Get()
  async getTransactions(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    const transactionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      transactionParams
    );
    return getGroupTransactionsForUser(
      localsToTokenOrKey(res),
      groupId,
      transactionParams
    );
  }

  @Put()
  async applyCoupon(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const couponCode = req.body.couponCode;
    joiValidate(
      {
        groupId: Joi.number().required(),
        couponCode: Joi.string().required(),
      },
      { groupId, couponCode }
    );
    return applyCouponToGroupForUser(
      localsToTokenOrKey(res),
      groupId,
      couponCode
    );
  }

  @Get(":transactionId")
  async getTransaction(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const transactionId = req.params.transactionId;
    joiValidate(
      {
        groupId: Joi.number().required(),
        transactionId: Joi.number().required(),
      },
      { groupId, transactionId }
    );
    return getGroupTransactionForUser(
      localsToTokenOrKey(res),
      groupId,
      transactionId
    );
  }
}
