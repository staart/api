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
  getOrganizationMembershipsForUser
} from "../rest/organization";
import {
  Get,
  Put,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  ClassWrapper
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import { ErrorCode, MembershipRole } from "../interfaces/enum";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { inviteMemberToOrganization } from "../rest/membership";
import { joiValidate } from "../helpers/utils";
import Joi from "@hapi/joi";

@Controller("organizations")
@ClassWrapper(asyncHandler)
@ClassMiddleware(authHandler)
export class OrganizationController {
  @Put()
  async put(req: Request, res: Response) {
    const name = req.body.name;
    const invitationDomain = req.body.invitationDomain;
    joiValidate(
      {
        name: Joi.string()
          .min(3)
          .required(),
        invitationDomain: Joi.string().min(3)
      },
      {
        name,
        invitationDomain
      }
    );
    await newOrganizationForUser(
      res.locals.token.id,
      { name, invitationDomain },
      res.locals
    );
    res.status(CREATED).json({ success: true });
  }

  @Get(":id")
  async get(req: Request, res: Response) {
    const id = req.params.id;
    joiValidate({ id: Joi.number().required() }, { id });
    const organization = await getOrganizationForUser(res.locals.token.id, id);
    res.json(organization);
  }

  @Patch(":id")
  async patch(req: Request, res: Response) {
    const id = req.params.id;
    joiValidate({ id: Joi.number().required() }, { id });
    await updateOrganizationForUser(
      res.locals.token.id,
      id,
      req.body,
      res.locals
    );
    res.json({ success: true });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const organizationId = req.params.id;
    const userId = res.locals.token.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    await deleteOrganizationForUser(userId, organizationId, res.locals);
    res.json({ success: true });
  }

  @Get(":id/billing")
  async getBilling(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationBillingForUser(res.locals.token.id, organizationId)
    );
  }

  @Patch(":id/billing")
  async patchBilling(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    await updateOrganizationBillingForUser(
      res.locals.token.id,
      organizationId,
      req.body,
      res.locals
    );
    res.json({ updated: true });
  }

  @Get(":id/invoices")
  async getInvoices(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationInvoicesForUser(res.locals.token.id, organizationId)
    );
  }

  @Get(":id/subscriptions")
  async getSubscriptions(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationSubscriptionsForUser(
        res.locals.token.id,
        organizationId
      )
    );
  }

  @Get(":id/pricing/:product")
  async getPlans(req: Request, res: Response) {
    const product = req.params.product;
    const organizationId = req.params.id;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        product: Joi.string().required()
      },
      { organizationId, product }
    );
    res.json(
      await getOrganizationPricingPlansForUser(
        res.locals.token.id,
        organizationId,
        product
      )
    );
  }

  @Get(":id/sources")
  async getSources(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationSourcesForUser(res.locals.token.id, organizationId)
    );
  }

  @Put(":id/sources")
  async putSources(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res
      .status(CREATED)
      .json(
        await createOrganizationSourceForUser(
          res.locals.token.id,
          organizationId,
          req.body
        )
      );
  }

  @Get(":id/sources/:sourceId")
  async getSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = req.params.id;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.number().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await getOrganizationSourceForUser(
        res.locals.token.id,
        organizationId,
        sourceId
      )
    );
  }

  @Delete(":id/sources/:sourceId")
  async deleteSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = req.params.id;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.number().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await deleteOrganizationSourceForUser(
        res.locals.token.id,
        organizationId,
        sourceId
      )
    );
  }

  @Patch(":id/sources/:sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = req.params.id;
    joiValidate(
      {
        organizationId: Joi.number().required(),
        sourceId: Joi.number().required()
      },
      { organizationId, sourceId }
    );
    res.json(
      await updateOrganizationSourceForUser(
        res.locals.token.id,
        organizationId,
        sourceId,
        req.body
      )
    );
  }

  @Get(":id/data")
  async getData(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getAllOrganizationDataForUser(res.locals.token.id, organizationId)
    );
  }

  @Get(":id/events")
  async getEvents(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationRecentEventsForUser(
        res.locals.token.id,
        organizationId
      )
    );
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    const organizationId = req.params.id;
    joiValidate(
      { organizationId: Joi.number().required() },
      { organizationId }
    );
    res.json(
      await getOrganizationMembershipsForUser(
        res.locals.token.id,
        organizationId,
        req.query.start
      )
    );
  }

  @Put(":id/memberships")
  async putMemberships(req: Request, res: Response) {
    const organizationId = req.params.id;
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
      res.locals.token.id,
      organizationId,
      newMemberName,
      newMemberEmail,
      role || MembershipRole.MEMBER,
      res.locals
    );
    res.status(CREATED).json({ invited: true });
  }
}
