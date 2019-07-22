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
  deleteApiKeyForUser,
  getOrganizationDomainsForUser,
  createDomainForUser,
  getOrganizationDomainForUser,
  updateDomainForUser,
  deleteDomainForUser,
  verifyDomainForUser
} from "../rest/organization";
import {
  Get,
  Put,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  ClassWrapper,
  Middleware,
  Post
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
        name: Joi.string().required()
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
        forceTwoFactor: Joi.boolean(),
        autoJoinDomain: Joi.boolean(),
        onlyAllowDomain: Joi.boolean(),
        ipRestrictions: Joi.string()
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
  @Middleware(
    validator(
      {
        scopes: Joi.string(),
        ipRestrictions: Joi.string(),
        referrerRestrictions: Joi.string(),
        name: Joi.string(),
        description: Joi.string()
      },
      "body"
    )
  )
  async putUserApiKeys(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
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
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(""),
        ipRestrictions: Joi.string().allow(""),
        referrerRestrictions: Joi.string().allow(""),
        name: Joi.string().allow(""),
        description: Joi.string().allow("")
      },
      "body"
    )
  )
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

  @Get(":id/domains")
  async getUserDomains(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    const domainParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      domainParams
    );
    res.json(
      await getOrganizationDomainsForUser(
        localsToTokenOrKey(res),
        id,
        domainParams
      )
    );
  }

  @Put(":id/domains")
  @Middleware(
    validator(
      {
        domain: Joi.string()
      },
      "body"
    )
  )
  async putUserDomains(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res
      .status(CREATED)
      .json(
        await createDomainForUser(
          localsToTokenOrKey(res),
          id,
          req.body,
          res.locals
        )
      );
  }

  @Get(":id/domains/:domainId")
  async getUserDomain(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const domainId = req.params.domainId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        domainId: Joi.number().required()
      },
      { id, domainId }
    );
    res.json(
      await getOrganizationDomainForUser(localsToTokenOrKey(res), id, domainId)
    );
  }

  @Patch(":id/domains/:domainId")
  @Middleware(
    validator(
      {
        domain: Joi.string()
      },
      "body"
    )
  )
  async patchUserDomain(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const domainId = req.params.domainId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        domainId: Joi.number().required()
      },
      { id, domainId }
    );
    res.json(
      await updateDomainForUser(
        localsToTokenOrKey(res),
        id,
        domainId,
        req.body,
        res.locals
      )
    );
  }

  @Delete(":id/domains/:domainId")
  async deleteUserDomain(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const domainId = req.params.domainId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        domainId: Joi.number().required()
      },
      { id, domainId }
    );
    res.json(
      await deleteDomainForUser(
        localsToTokenOrKey(res),
        id,
        domainId,
        res.locals
      )
    );
  }

  @Post(":id/domains/:domainId/verify")
  async verifyOrganizationDomain(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const domainId = req.params.domainId;
    const method = req.body.method || req.query.method;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        domainId: Joi.number().required(),
        method: Joi.string().only(["file", "dns"])
      },
      { id, domainId, method }
    );
    res.json(
      await verifyDomainForUser(
        localsToTokenOrKey(res),
        id,
        domainId,
        method,
        res.locals
      )
    );
  }
}
