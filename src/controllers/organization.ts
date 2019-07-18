import { Request, Response } from "express";
import {
  newOrganizationForUser,
  updateOrganizationForUser,
  deleteOrganizationForUser,
  getOrganizationForUser,
  getOrganizationBillingForUser,
  updateOrganizationBillingForUser,
  getOrganizationInvoicesForUser,
  getOrganizationSubscriptionsForUser,
  getOrganizationPricingPlansForUser,
  getOrganizationSourcesForUser,
  getOrganizationSourceForUser,
  createOrganizationSourceForUser,
  updateOrganizationSourceForUser,
  deleteOrganizationSourceForUser,
  getAllOrganizationDataForUser,
  getOrganizationRecentEventsForUser,
  getOrganizationMembershipsForUser,
  createOrganizationSubscriptionForUser,
  getOrganizationSubscriptionForUser,
  updateOrganizationSubscriptionForUser,
  getOrganizationInvoiceForUser,
  getOrganizationApiKeysForUser,
  createApiKeyForUser,
  getOrganizationApiKeyForUser,
  updateApiKeyForUser,
  deleteApiKeyForUser
} from "../rest/organization";
import {
  Get,
  Put,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  ClassWrapper,
  Middleware
} from "@overnightjs/core";
import { authHandler, validator } from "../helpers/middleware";
import { MembershipRole } from "../interfaces/enum";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { inviteMemberToOrganization } from "../rest/membership";
import {
  joiValidate,
  organizationUsernameToId,
  localsToTokenOrKey
} from "../helpers/utils";
import Joi from "@hapi/joi";

@Controller("organizations")
@ClassWrapper(asyncHandler)
@ClassMiddleware(authHandler)
export class OrganizationController {
  @Put()
  @Middleware(
    validator(
      {
        name: Joi.string().required(),
        invitationDomain: Joi.string()
      },
      "body"
    )
  )
  async put(req: Request, res: Response) {
    await newOrganizationForUser(res.locals.token.id, req.body, res.locals);
    res
      .status(CREATED)
      .json({ success: true, message: "organization-created" });
  }

  @Get(":id")
  async get(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const organization = await getOrganizationForUser(
      localsToTokenOrKey(res),
      id
    );
    res.json(organization);
  }

  @Patch(":id")
  @Middleware(
    validator(
      {
        name: Joi.string(),
        username: Joi.string(),
        forceTwoFactor: Joi.bool(),
        ipRestrictions: Joi.string(),
        invitationDomain: Joi.string().regex(
          /([a-z])([a-z0-9]+\.)*[a-z0-9]+\.[a-z.]+/
        )
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    await updateOrganizationForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    res.json({ success: true, message: "organization-updated" });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    await deleteOrganizationForUser(
      res.locals.token.id,
      organizationId,
      res.locals
    );
    res.json({ success: true, message: "organization-deleted" });
  }

  @Get(":id/billing")
  async getBilling(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationBillingForUser(
        localsToTokenOrKey(res),
        organizationId
      )
    );
  }

  @Patch(":id/billing")
  async patchBilling(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    await updateOrganizationBillingForUser(
      localsToTokenOrKey(res),
      organizationId,
      req.body,
      res.locals
    );
    res.json({ success: true, message: "organization-billing-updated" });
  }

  @Get(":id/invoices")
  async getInvoices(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
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
    res.json(
      await getOrganizationInvoicesForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionParams
      )
    );
  }

  @Get(":id/invoices/:invoiceId")
  async getInvoice(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const invoiceId = req.params.invoiceId;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        invoiceId: Joi.string().required()
      },
      { organizationId, invoiceId }
    );
    res.json(
      await getOrganizationInvoiceForUser(
        localsToTokenOrKey(res),
        organizationId,
        invoiceId
      )
    );
  }

  @Get(":id/sources")
  async getSources(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    const subscriptionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      subscriptionParams
    );
    res.json(
      await getOrganizationSourcesForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionParams
      )
    );
  }

  @Get(":id/sources/:sourceId")
  async getSource(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const sourceId = req.params.sourceId;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await getOrganizationSourceForUser(
        localsToTokenOrKey(res),
        organizationId,
        sourceId
      )
    );
  }

  @Get(":id/subscriptions")
  async getSubscriptions(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
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
    res.json(
      await getOrganizationSubscriptionsForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionParams
      )
    );
  }

  @Get(":id/subscriptions/:subscriptionId")
  async getSubscription(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        subscriptionId: Joi.string().required()
      },
      { organizationId, subscriptionId }
    );
    res.json(
      await getOrganizationSubscriptionForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionId
      )
    );
  }

  @Patch(":id/subscriptions/:subscriptionId")
  async patchSubscription(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const subscriptionId = req.params.subscriptionId;
    const data = req.body;
    joiValidate(
      {
        organizationId: Joi.number().required(),
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
    res.json(
      await updateOrganizationSubscriptionForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionId,
        data
      )
    );
  }

  @Put(":id/subscriptions")
  async putSubscriptions(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
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
    res.json(
      await createOrganizationSubscriptionForUser(
        localsToTokenOrKey(res),
        organizationId,
        subscriptionParams
      )
    );
  }

  @Get(":id/pricing/:product")
  async getPlans(req: Request, res: Response) {
    const product = req.params.product;
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.number().required(),
        product: Joi.string().required()
      },
      { organizationId, product }
    );
    res.json(
      await getOrganizationPricingPlansForUser(
        localsToTokenOrKey(res),
        organizationId,
        product
      )
    );
  }

  @Put(":id/sources")
  async putSources(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res
      .status(CREATED)
      .json(
        await createOrganizationSourceForUser(
          localsToTokenOrKey(res),
          organizationId,
          req.body
        )
      );
  }

  @Delete(":id/sources/:sourceId")
  async deleteSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await deleteOrganizationSourceForUser(
        localsToTokenOrKey(res),
        organizationId,
        sourceId
      )
    );
  }

  @Patch(":id/sources/:sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await updateOrganizationSourceForUser(
        localsToTokenOrKey(res),
        organizationId,
        sourceId,
        req.body
      )
    );
  }

  @Get(":id/data")
  async getData(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getAllOrganizationDataForUser(
        localsToTokenOrKey(res),
        organizationId
      )
    );
  }

  @Get(":id/events")
  async getEvents(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationRecentEventsForUser(
        localsToTokenOrKey(res),
        organizationId
      )
    );
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationMembershipsForUser(
        localsToTokenOrKey(res),
        organizationId,
        req.query
      )
    );
  }

  @Put(":id/memberships")
  async putMemberships(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const newMemberName = req.body.name;
    const newMemberEmail = req.body.email;
    const role = req.body.role;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        newMemberName: Joi.string()
          .min(6)
          .required(),
        newMemberEmail: Joi.string()
          .email()
          .required(),
        role: Joi.number()
      },
      {
        organizationId,
        newMemberName,
        newMemberEmail,
        role
      }
    );
    await inviteMemberToOrganization(
      localsToTokenOrKey(res),
      organizationId,
      newMemberName,
      newMemberEmail,
      role || MembershipRole.MEMBER,
      res.locals
    );
    res.status(CREATED).json({ invited: true });
  }

  @Get(":id/api-keys")
  async getUserApiKeys(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    const apiKeyParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      apiKeyParams
    );
    res.json(
      await getOrganizationApiKeysForUser(
        localsToTokenOrKey(res),
        id,
        apiKeyParams
      )
    );
  }

  @Put(":id/api-keys")
  async putUserApiKeys(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    joiValidate(
      {
        scopes: Joi.string().allow(null),
        ipRestrictions: Joi.string().allow(null),
        referrerRestrictions: Joi.string().allow(null)
      },
      req.body
    );
    res
      .status(CREATED)
      .json(
        await createApiKeyForUser(
          localsToTokenOrKey(res),
          id,
          req.body,
          res.locals
        )
      );
  }

  @Get(":id/api-keys/:apiKeyId")
  async getUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKeyId: Joi.number().required()
      },
      { id, apiKeyId }
    );
    res.json(
      await getOrganizationApiKeyForUser(localsToTokenOrKey(res), id, apiKeyId)
    );
  }

  @Patch(":id/api-keys/:apiKeyId")
  async patchUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKeyId: Joi.number().required()
      },
      { id, apiKeyId }
    );
    joiValidate(
      {
        scopes: Joi.string().allow(null),
        ipRestrictions: Joi.string().allow(null),
        referrerRestrictions: Joi.string().allow(null)
      },
      req.body
    );
    res.json(
      await updateApiKeyForUser(
        localsToTokenOrKey(res),
        id,
        apiKeyId,
        req.body,
        res.locals
      )
    );
  }

  @Delete(":id/api-keys/:apiKeyId")
  async deleteUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKeyId: Joi.number().required()
      },
      { id, apiKeyId }
    );
    res.json(
      await deleteApiKeyForUser(
        localsToTokenOrKey(res),
        id,
        apiKeyId,
        res.locals
      )
    );
  }
}
