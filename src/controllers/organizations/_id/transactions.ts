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
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  getGroupTransactionForUser,
  getGroupTransactionsForUser,
  applyCouponToGroupForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupTransactionsController {
  @Get()
  async getTransactions(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
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
    const groupId = await groupUsernameToId(req.params.id);
    const couponCode = req.body.couponCode;
    joiValidate(
      {
        groupId: Joi.string().required(),
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
    const groupId = await groupUsernameToId(req.params.id);
    const transactionId = req.params.transactionId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        transactionId: Joi.string().required(),
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
