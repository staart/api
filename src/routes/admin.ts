import { Request, Response } from "express";
import { ErrorCode } from "../interfaces/enum";
import { getAllOrganizationForUser, getAllUsersForUser } from "../rest/admin";

export const routeAdminOrganizations = async (req: Request, res: Response) => {
  const userId = res.locals.token.id;
  if (!userId) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getAllOrganizationForUser(userId));
};

export const routeAdminUsers = async (req: Request, res: Response) => {
  const userId = res.locals.token.id;
  if (!userId) throw new Error(ErrorCode.MISSING_FIELD);
  res.json(await getAllUsersForUser(userId));
};
