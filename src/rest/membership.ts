import { MembershipRole, ErrorCode, Authorizations } from "../interfaces/enum";
import { getUserByEmail } from "../crud/user";
import {
  createMembership,
  getMembership,
  deleteMembership,
  getOrganizationMembers,
  getUserOrganizationMembership,
  getMembershipDetailed,
  updateMembership
} from "../crud/membership";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";
import { can } from "../helpers/authorization";
import { Locals, KeyValue } from "../interfaces/general";
import { ApiKeyResponse } from "../helpers/jwt";
import { getOrganization, getDomainByDomainName } from "../crud/organization";

export const getMembershipDetailsForUser = async (
  userId: number,
  membershipId: number
) => {
  if (await can(userId, Authorizations.READ, "membership", membershipId))
    return await getMembershipDetailed(membershipId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteMembershipForUser = async (
  tokenUserId: number | ApiKeyResponse,
  membershipId: number,
  locals: Locals
) => {
  const membership = await getMembership(membershipId);
  if (!membership || !membership.id)
    throw new Error(ErrorCode.MEMBERSHIP_NOT_FOUND);
  if (await can(tokenUserId, Authorizations.DELETE, "membership", membership)) {
    if (membership.role == MembershipRole.OWNER) {
      const organizationMembers = await getOrganizationMembers(
        membership.organizationId
      );
      const currentMembers = organizationMembers.filter(
        member => member.role == MembershipRole.OWNER
      );
      if (currentMembers.length < 2)
        throw new Error(ErrorCode.CANNOT_DELETE_SOLE_OWNER);
    }
    await deleteMembership(membership.id);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateMembershipForUser = async (
  userId: number | ApiKeyResponse,
  membershipId: number,
  data: KeyValue,
  locals: Locals
) => {
  if (await can(userId, Authorizations.UPDATE, "membership", membershipId)) {
    const membership = await getMembership(membershipId);
    if (data.role != membership.role) {
      if (membership.role == MembershipRole.OWNER) {
        const organizationMembers = await getOrganizationMembers(
          membership.organizationId
        );
        const currentMembers = organizationMembers.filter(
          member => member.role == MembershipRole.OWNER
        );
        if (currentMembers.length < 2)
          throw new Error(ErrorCode.CANNOT_UPDATE_SOLE_OWNER);
      }
    }
    await updateMembership(membershipId, data);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
