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
  getOrganizationRecentEventsForUser
} from "../rest/organization";
import { ErrorCode } from "../interfaces/enum";

export const routeOrganizationGet = async (req: Request, res: Response) => {
  const organization = await getOrganizationForUser(
    res.locals.token.id,
    req.params.id
  );
  res.json(organization);
};

export const routeOrganizationCreate = async (req: Request, res: Response) => {
  const name = req.body.name;
  const invitationDomain = req.body.invitationDomain;
  await newOrganizationForUser(
    res.locals.token.id,
    { name, invitationDomain },
    res.locals
  );
  res.json({ success: true });
};

export const routeOrganizationUpdate = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  await updateOrganizationForUser(
    res.locals.token.id,
    id,
    req.body,
    res.locals
  );
  res.json({ success: true });
};

export const routeOrganizationDelete = async (req: Request, res: Response) => {
  const organizationId = req.params.id;
  const userId = res.locals.token.id;
  if (!organizationId) throw new Error(ErrorCode.MISSING_FIELD);
  await deleteOrganizationForUser(userId, organizationId, res.locals);
  res.json({ success: true });
};

export const routeOrganizationBillingGet = async (
  req: Request,
  res: Response
) => {
  res.json(
    await getOrganizationBillingForUser(res.locals.token.id, req.params.id)
  );
};

export const routeOrganizationBillingUpdate = async (
  req: Request,
  res: Response
) => {
  await updateOrganizationBillingForUser(
    res.locals.token.id,
    req.params.id,
    req.body,
    res.locals
  );
  res.json({ updated: true });
};

export const routeOrganizationInvoicesGet = async (
  req: Request,
  res: Response
) => {
  res.json(
    await getOrganizationInvoicesForUser(res.locals.token.id, req.params.id)
  );
};

export const routeOrganizationSubscriptionsGet = async (
  req: Request,
  res: Response
) => {
  res.json(
    await getOrganizationSubscriptionsForUser(
      res.locals.token.id,
      req.params.id
    )
  );
};

export const routeOrganizationPricingPlansGet = async (
  req: Request,
  res: Response
) => {
  const product = req.params.product;
  if (!product) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(
    await getOrganizationPricingPlansForUser(
      res.locals.token.id,
      req.params.id,
      product
    )
  );
};

export const routeOrganizationSourcesGet = async (
  req: Request,
  res: Response
) => {
  res.json(
    await getOrganizationSourcesForUser(res.locals.token.id, req.params.id)
  );
};

export const routeOrganizationSourceGet = async (
  req: Request,
  res: Response
) => {
  const sourceId = req.params.sourceId;
  if (!sourceId) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(
    await getOrganizationSourceForUser(
      res.locals.token.id,
      req.params.id,
      sourceId
    )
  );
};

export const routeOrganizationSourceDelete = async (
  req: Request,
  res: Response
) => {
  const sourceId = req.params.sourceId;
  if (!sourceId) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(
    await deleteOrganizationSourceForUser(
      res.locals.token.id,
      req.params.id,
      sourceId
    )
  );
};

export const routeOrganizationSourceUpdate = async (
  req: Request,
  res: Response
) => {
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
};

export const routeOrganizationSourcesPut = async (
  req: Request,
  res: Response
) => {
  res.json(
    await createOrganizationSourceForUser(
      res.locals.token.id,
      req.params.id,
      req.body
    )
  );
};

export const routeOrganizationDataGet = async (req: Request, res: Response) => {
  res.json(
    await getAllOrganizationDataForUser(res.locals.token.id, req.params.id)
  );
};

export const routeOrganizationRecentEventsGet = async (
  req: Request,
  res: Response
) => {
  res.json(
    await getOrganizationRecentEventsForUser(res.locals.token.id, req.params.id)
  );
};
