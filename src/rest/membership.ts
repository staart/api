import { MembershipRole, ErrorCode, Authorizations } from "../interfaces/enum";
import { getUserByEmail } from "../crud/user";
import { createMembership, getMembership } from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";
import { can } from "../helpers/authorization";

export const getMembershipDetailsForUser = async (
  userId: number,
  membershipId: number,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "membership", membershipId))
    return await getMembership(membershipId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const inviteMemberToOrganization = async (
  userId: number,
  organizationId: number,
  newMemberName: string,
  newMemberEmail: string,
  role: MembershipRole
) => {
  if (
    await can(
      userId,
      Authorizations.INVITE_MEMBER,
      "organization",
      organizationId
    )
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
