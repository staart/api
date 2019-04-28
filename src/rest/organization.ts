import { Organization } from "../interfaces/tables/organization";
import { createOrganization, updateOrganization } from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import { createMembership, getUserOrganizationId } from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  UserRole,
  EventType
} from "../interfaces/enum";
import { getUser } from "../crud/user";
import { createEvent } from "../crud/event";
import { Locals } from "../interfaces/general";

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
