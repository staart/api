import { can } from "../helpers/authorization";
import { Authorizations, ErrorCode } from "../interfaces/enum";
import { getAllOrganizations } from "../crud/organization";
import { getAllUsers } from "../crud/user";

export const getAllOrganizationForUser = async (tokenUserId: number) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return await getAllOrganizations();
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllUsersForUser = async (tokenUserId: number) => {
  if (await can(tokenUserId, Authorizations.READ, "general"))
    return await getAllUsers();
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
