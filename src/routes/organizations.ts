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
  Post,
  Put,
  Delete,
  Controller,
  ClassMiddleware
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import { ErrorCode } from "../interfaces/enum";

@Controller("organization")
@ClassMiddleware(authHandler)
export class OrganizationController {
  @Put()
  async put(req: Request, res: Response) {
    const name = req.body.name;
    const invitationDomain = req.body.invitationDomain;
    await newOrganizationForUser(
      res.locals.token.id,
      { name, invitationDomain },
      res.locals
    );
    res.json({ success: true });
  }

  @Get(":id")
  async get(req: Request, res: Response) {
    const organization = await getOrganizationForUser(
      res.locals.token.id,
      req.params.id
    );
    res.json(organization);
  }

  @Post(":id")
  async patch(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new Error(ErrorCode.MISSING_FIELD);
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
    if (!organizationId) throw new Error(ErrorCode.MISSING_FIELD);
    await deleteOrganizationForUser(userId, organizationId, res.locals);
    res.json({ success: true });
  }

  @Get(":id/billing")
  async getBilling(req: Request, res: Response) {
    res.json(
      await getOrganizationBillingForUser(res.locals.token.id, req.params.id)
    );
  }

  @Post(":id/billing")
  async patchBilling(req: Request, res: Response) {
    await updateOrganizationBillingForUser(
      res.locals.token.id,
      req.params.id,
      req.body,
      res.locals
    );
    res.json({ updated: true });
  }

  @Get(":id/invoices")
  async getInvoices(req: Request, res: Response) {
    res.json(
      await getOrganizationInvoicesForUser(res.locals.token.id, req.params.id)
    );
  }

  @Get(":id/subscriptions")
  async getSubscriptions(req: Request, res: Response) {
    res.json(
      await getOrganizationSubscriptionsForUser(
        res.locals.token.id,
        req.params.id
      )
    );
  }

  @Get(":id/plans")
  async getPlans(req: Request, res: Response) {
    const product = req.params.product;
    if (!product) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await getOrganizationPricingPlansForUser(
        res.locals.token.id,
        req.params.id,
        product
      )
    );
  }

  @Get(":id/sources")
  async getSources(req: Request, res: Response) {
    res.json(
      await getOrganizationSourcesForUser(res.locals.token.id, req.params.id)
    );
  }

  @Put(":id/sources")
  async putSources(req: Request, res: Response) {
    res.json(
      await createOrganizationSourceForUser(
        res.locals.token.id,
        req.params.id,
        req.body
      )
    );
  }

  @Get(":id/source/:sourceId")
  async getSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    if (!sourceId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await getOrganizationSourceForUser(
        res.locals.token.id,
        req.params.id,
        sourceId
      )
    );
  }

  @Delete(":id/source/:sourceId")
  async deleteSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    if (!sourceId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await deleteOrganizationSourceForUser(
        res.locals.token.id,
        req.params.id,
        sourceId
      )
    );
  }

  @Post(":id/source/:sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    if (!sourceId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await updateOrganizationSourceForUser(
        res.locals.token.id,
        req.params.id,
        sourceId,
        req.body
      )
    );
  }

  @Get(":id/data")
  async getData(req: Request, res: Response) {
    res.json(
      await getAllOrganizationDataForUser(res.locals.token.id, req.params.id)
    );
  }

  @Get(":id/events")
  async getEvents(req: Request, res: Response) {
    res.json(
      await getOrganizationRecentEventsForUser(
        res.locals.token.id,
        req.params.id
      )
    );
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    const organizationId = req.params.organizationId;
    if (!organizationId) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(
      await getOrganizationMembershipsForUser(
        res.locals.token.id,
        organizationId
      )
    );
  }
}
