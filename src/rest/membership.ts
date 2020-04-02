import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_DELETE_SOLE_OWNER,
  CANNOT_UPDATE_SOLE_OWNER,
  INSUFFICIENT_PERMISSION,
  MEMBERSHIP_NOT_FOUND
} from "@staart/errors";
import { can } from "../helpers/authorization";
import { ApiKeyResponse } from "../helpers/jwt";
import { trackEvent } from "../helpers/tracking";
import { Authorizations, EventType } from "../interfaces/enum";
import { Locals } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import { membershipsUpdateInput } from "@prisma/client";

export const getMembershipDetailsForUser = async (
  userId: string,
  membershipId: string
) => {
  if (await can(userId, Authorizations.READ, "membership", membershipId))
    return prisma.memberships.findOne({
      where: { id: parseInt(membershipId) },
      include: { user: true, organization: true }
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteMembershipForUser = async (
  tokenUserId: string | ApiKeyResponse,
  membershipId: string,
  locals: Locals
) => {
  const membership = await prisma.memberships.findOne({
    where: { id: parseInt(membershipId) }
  });
  if (!membership) throw new Error(MEMBERSHIP_NOT_FOUND);
  if (await can(tokenUserId, Authorizations.DELETE, "membership", membership)) {
    const organizationMembers = await prisma.memberships.findMany({
      where: { organizationId: membership.organizationId }
    });
    if (membership.role === "OWNER") {
      const currentMembers = organizationMembers.filter(
        member => member.role === "OWNER"
      );
      if (currentMembers.length < 2) throw new Error(CANNOT_DELETE_SOLE_OWNER);
    }
    if (organizationMembers.length === 1)
      throw new Error(CANNOT_DELETE_SOLE_MEMBER);
    trackEvent(
      {
        userId: membershipId,
        type: EventType.MEMBERSHIP_DELETED
      },
      locals
    );
    return await prisma.memberships.delete({ where: { id: membership.id } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateMembershipForUser = async (
  userId: string | ApiKeyResponse,
  membershipId: string,
  data: membershipsUpdateInput,
  locals: Locals
) => {
  if (await can(userId, Authorizations.UPDATE, "membership", membershipId)) {
    const membership = await prisma.memberships.findOne({
      where: { id: parseInt(membershipId) }
    });
    if (!membership) throw new Error(MEMBERSHIP_NOT_FOUND);
    if (data.role !== membership.role) {
      if (membership.role === "OWNER") {
        const organizationMembers = await prisma.memberships.findMany({
          where: { organizationId: membership.organizationId }
        });
        const currentMembers = organizationMembers.filter(
          member => member.role === "OWNER"
        );
        if (currentMembers.length < 2)
          throw new Error(CANNOT_UPDATE_SOLE_OWNER);
      }
    }
    trackEvent(
      {
        userId: membershipId,
        type: EventType.MEMBERSHIP_UPDATED
      },
      locals
    );
    return prisma.memberships.update({
      where: { id: parseInt(membershipId) },
      data
    });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
