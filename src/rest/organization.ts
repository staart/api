import { Organization } from "../interfaces/tables/organization";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization
} from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import {
  createMembership,
  getUserOrganizationId,
  getUserMembershipObject,
  deleteAllOrganizationMemberships
} from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  UserRole,
  EventType
} from "../interfaces/enum";
import { getUser } from "../crud/user";
import { createEvent } from "../crud/event";
import { Locals } from "../interfaces/general";

export const getOrganizationForUser = async (
  userId: number,
  organizationId: number
) => {
  const userMembership = await getUserMembershipObject(userId);
  const organization = await getOrganization(organizationId);
  if (userMembership.organizationId == organizationId) return organization;
  const user = await getUser(userId);
  if (user.role == UserRole.ADMIN) return organization;
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: number,
  organization: Organization,
  locals: Locals
) => {
  const org = <InsertResult>await createOrganization(organization);
  await createMembership({
    organizationId: org.insertId,
    userId,
    role: MembershipRole.OWNER
  });
  await createEvent(
    {
      userId,
      type: EventType.ORGANIZATION_CREATED,
      data: { id: org.insertId }
    },
    locals
  );
  return;
};

export const updateOrganizationForUser = async (
  userId: number,
  organizationId: number,
  data: Organization,
  locals: Locals
) => {
  const user = await getUser(userId);
  const userOrganizationId = await getUserOrganizationId(user);
  if (organizationId == userOrganizationId || user.role == UserRole.ADMIN) {
    await updateOrganization(organizationId, data);
    await createEvent(
      {
        userId,
        type: EventType.ORGANIZATION_UPDATED,
        data: { id: organizationId, data }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: number,
  organizationId: number,
  locals: Locals
) => {
  const user = await getUser(userId);
  const userMembership = await getUserMembershipObject(userId);
  if (
    user.role == UserRole.ADMIN ||
    (userMembership.organizationId == organizationId &&
      userMembership.role == MembershipRole.OWNER)
  ) {
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
    await createEvent(
      {
        userId,
        type: EventType.ORGANIZATION_DELETED,
        data: { id: organizationId }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
