import { RESOURCE_CREATED, RESOURCE_UPDATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
  Get,
  Patch,
  Put,
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
  createOrganizationSubscriptionForUser,
  getOrganizationSubscriptionForUser,
  getOrganizationSubscriptionsForUser,
  updateOrganizationSubscriptionForUser,
} from "../../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationSubscriptionsController {
  @Get()
  async getSubscriptions(req: Request, res: Response) {
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
    return getOrganizationSubscriptionsForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionParams
    );
  }

  @Put()
  async putSubscriptions(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
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
    await createOrganizationSubscriptionForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionParams,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":subscriptionId")
  async getSubscription(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        subscriptionId: Joi.string().required(),
      },
      { organizationId, subscriptionId }
    );
    return getOrganizationSubscriptionForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionId
    );
  }

  @Patch(":subscriptionId")
  async patchSubscription(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    const data = req.body;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        subscriptionId: Joi.string().required(),
      },
      { organizationId, subscriptionId }
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
    await updateOrganizationSubscriptionForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionId,
      data,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }
}
