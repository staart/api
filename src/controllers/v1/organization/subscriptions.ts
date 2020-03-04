import {
  getOrganizationSubscriptionsForUser,
  createOrganizationSubscriptionForUser,
  getOrganizationSubscriptionForUser,
  updateOrganizationSubscriptionForUser
} from "../../../rest/organization";
import { RESOURCE_CREATED, respond, RESOURCE_UPDATED } from "@staart/messages";
import {
  Get,
  Put,
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

@Controller(":id/subscriptions")
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
        status: Joi.string()
      },
      subscriptionParams
    );
    return await getOrganizationSubscriptionsForUser(
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
        number_of_seats: Joi.number()
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
        subscriptionId: Joi.string().required()
      },
      { organizationId, subscriptionId }
    );
    return await getOrganizationSubscriptionForUser(
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
        subscriptionId: Joi.string().required()
      },
      { organizationId, subscriptionId }
    );
    joiValidate(
      {
        billing: Joi.string().valid("charge_automatically", "send_invoice"),
        cancel_at_period_end: Joi.boolean(),
        coupon: Joi.string(),
        default_source: Joi.string()
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
