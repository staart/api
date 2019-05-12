import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import {
  getMembershipDetailsForUser,
  inviteMemberToOrganization,
  deleteMembershipForUser
} from "../rest/membership";
import { getOrganizationMemberDetails } from "../crud/membership";

export const routeMembershipGet = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getMembershipDetailsForUser(res.locals.token.id, id));
};

export const routeMembershipCreate = async (req: Request, res: Response) => {
  const organizationId = req.params.organizationId;
  const newMemberName = req.body.name;
  const newMemberEmail = req.body.email;
  const role = req.body.role;
  if (!organizationId || !newMemberName || !newMemberEmail || !role)
    throw new Error(ErrorCode.MISSING_FIELD);
  await inviteMemberToOrganization(
    res.locals.token.id,
    organizationId,
    newMemberName,
    newMemberEmail,
    role,
    res.locals
  );
  res.json({ invited: true });
};

export const routeMembershipDelete = async (req: Request, res: Response) => {
  const id = res.locals.token.id;
  const membershipId = req.params.id;
  if (!id || !membershipId) throw new Error(ErrorCode.MISSING_FIELD);
  await deleteMembershipForUser(id, membershipId, res.locals);
  res.json({ deleted: true });
};

export const routeMembershipList = async (req: Request, res: Response) => {
  const organizationId = req.params.organizationId;
  if (!organizationId) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getOrganizationMemberDetails(organizationId));
};
