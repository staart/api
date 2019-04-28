import { Request, Response } from "express";
import {
  newOrganizationForUser,
  updateOrganizationForUser
} from "../rest/organization";
import { ErrorCode } from "../interfaces/enum";

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
