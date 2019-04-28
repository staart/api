import { ErrorCode, MembershipRole, UserRole } from "../interfaces/enum";
import { getUser } from "../crud/user";
import {
  getUserOrganizationId,
  getUserMembershipObject
} from "../crud/membership";

export const getUserFromId = async (userId: number, tokenId: number) => {
  const user = await getUser(userId);
  // You can access this user if:
  // (i) You're the user
  if (userId == tokenId) return user;
  // (ii) You're a super-admin
  const tokenUser = await getUser(tokenId);
  if (tokenUser.role == UserRole.ADMIN) return user;
  // You're both in the same organization
  const tokenOrganization = await getUserMembershipObject(tokenUser);
  const userOrganizationId = await getUserOrganizationId(user);
  // and you're not a basic member
  if (
    tokenOrganization.organizationId == userOrganizationId &&
    tokenOrganization.role !== MembershipRole.BASIC
  )
    return user;
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
