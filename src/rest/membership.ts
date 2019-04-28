import { MembershipRole, UserRole, ErrorCode } from "../interfaces/enum";
import { getUser, getUserByEmail } from "../crud/user";
import {
  getUserMembershipObject,
  createMembership,
  getMembership
} from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";

export const getMembershipDetailsForUser = async (
  userId: number,
  membershipId: number,
  organizationId: number
) => {
  const tokenUser = await getUser(userId);
  const tokenUserMembership = await getUserMembershipObject(tokenUser);
  const membership = await getMembership(membershipId);
  if (
    tokenUser.id == membership.userId ||
    tokenUser.role == UserRole.ADMIN ||
    (tokenUserMembership.organizationId == organizationId &&
      [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
        MembershipRole.MANAGER,
        MembershipRole.MEMBER
      ].includes(tokenUserMembership.role))
  ) {
    return membership;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const inviteMemberToOrganization = async (
  userId: number,
  organizationId: number,
  newMemberName: string,
  newMemberEmail: string,
  role: MembershipRole
) => {
  const tokenUser = await getUser(userId);
  const tokenUserMembership = await getUserMembershipObject(tokenUser);
  if (
    tokenUser.role == UserRole.ADMIN ||
    (tokenUserMembership.organizationId == organizationId &&
      [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
        MembershipRole.MANAGER
      ].includes(tokenUserMembership.role))
  ) {
    let newUser: User;
    try {
      newUser = await getUserByEmail(newMemberEmail);
      if (!newUser.id) throw new Error(ErrorCode.USER_NOT_FOUND);
      await createMembership({ userId: newUser.id, organizationId, role });
      return;
    } catch (error) {
      await register(
        { name: newMemberName },
        newMemberEmail,
        organizationId,
        role
      );
      return;
    }
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
