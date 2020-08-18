import { RESOURCE_CREATED, RESOURCE_UPDATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Get,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  createGroupSubscriptionForUser,
  getGroupSubscriptionForUser,
  getGroupSubscriptionsForUser,
  updateGroupSubscriptionForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupSubscriptionsController {
  @Get()
  async getSubscriptions(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
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
    return getGroupSubscriptionsForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionParams
    );
  }

  @Put()
  async putSubscriptions(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    const subscriptionParams = { ...req.body };
    joiValidate(
      {
        plan: Joi.string().required(),
        billing: Joi.string().valid("charge_automatically", "send_invoice"),
        tax_percent: Joi.number(),
        number_of_seats: Joi.number(),
      },
      subscriptionParams
    );
    await createGroupSubscriptionForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionParams,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":subscriptionId")
  async getSubscription(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    joiValidate(
      {
        groupId: Joi.number().required(),
        subscriptionId: Joi.number().required(),
      },
      { groupId, subscriptionId }
    );
    return getGroupSubscriptionForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionId
    );
  }

  @Patch(":subscriptionId")
  async patchSubscription(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    const data = req.body;
    joiValidate(
      {
        groupId: Joi.number().required(),
        subscriptionId: Joi.number().required(),
      },
      { groupId, subscriptionId }
    );
    joiValidate(
      {
        billing: Joi.string().valid("charge_automatically", "send_invoice"),
        cancel_at_period_end: Joi.boolean(),
        coupon: Joi.string(),
        default_source: Joi.string(),
        items: Joi.array(),
        proration_behavior: Joi.string(),
      },
      data
    );
    await updateGroupSubscriptionForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionId,
      data,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }
}
