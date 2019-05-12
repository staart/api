import { Request, Response } from "express";
import {
  newOrganizationForUser,
  updateOrganizationForUser,
  deleteOrganizationForUser,
  getOrganizationForUser,
  getOrganizationBillingForUser,
  updateOrganizationBillingForUser
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
  const billing = await getOrganizationBillingForUser(
    res.locals.token.id,
    req.params.id
  );
  res.json(billing);
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
