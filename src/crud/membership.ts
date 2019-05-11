import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues
} from "../helpers/mysql";
import { Membership } from "../interfaces/tables/memberships";
import { dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getOrganization } from "./organization";
import { ErrorCode, CacheCategories } from "../interfaces/enum";
import { deleteItemFromCache, cachedQuery } from "../helpers/cache";

/*
 * Create a new organization membership for a user
 */
export const createMembership = async (membership: Membership) => {
  membership.createdAt = new Date();
  membership.updatedAt = membership.createdAt;
  deleteItemFromCache(
    CacheCategories.ORGANIZATION_MEMBERSHIPS,
    membership.organizationId
  );
  return await query(
    `INSERT INTO memberships ${tableValues(membership)}`,
    Object.values(membership)
  );
};

/*
 * Update an organization membership for a user
 */
export const updateMembership = async (id: number, membership: KeyValue) => {
  membership.updatedAt = dateToDateTime(new Date());
  membership = removeReadOnlyValues(membership);
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query(
    `UPDATE memberships SET ${setValues(membership)} WHERE id = ?`,
    [...Object.values(membership), id]
  );
};

/*
 * Delete an organization membership
 */
export const deleteMembership = async (id: number) => {
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query("DELETE FROM memberships WHERE id = ?", [id]);
};

/*
 * Delete all memberships in an organization
 */
export const deleteAllOrganizationMemberships = async (
  organizationId: number
) => {
  deleteItemFromCache(CacheCategories.ORGANIZATION_MEMBERSHIPS, organizationId);
  return await query("DELETE FROM memberships WHERE organizationId = ?", [
    organizationId
  ]);
};

/*
 * Delete all memberships for a user
 */
export const deleteAllUserMemberships = async (userId: number) => {
  return await query("DELETE FROM memberships WHERE userId = ?", [userId]);
};

/*
 * Get details about a specific organization membership
 */
export const getMembership = async (id: number) => {
  return (<Membership[]>(
    await cachedQuery(
      CacheCategories.MEMBERSHIP,
      id,
      "SELECT * FROM memberships WHERE id = ? LIMIT 1",
      [id]
    )
  ))[0];
};

/*
 * Get a list of all members in an organization
 */
export const getOrganizationMembers = async (organizationId: number) => {
  return <Membership[]>(
    await cachedQuery(
      CacheCategories.ORGANIZATION_MEMBERSHIPS,
      organizationId,
      `SELECT * FROM memberships WHERE organizationId = ?`,
      [organizationId]
    )
  );
};

/*
 * Get a detailed list of all members in an organization
 */
export const getOrganizationMemberDetails = async (organizationId: number) => {
  const members = await getOrganizationMembers(organizationId);
  return members;
};

export const getUserMemberships = async (user: User | number) => {
  if (typeof user !== "number" && typeof user !== "string") {
    if (user.id) {
      user = user.id;
    } else {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }
  }
  return <Membership[]>(
    await cachedQuery(
      CacheCategories.USER_MEMBERSHIPS,
      user,
      `SELECT * FROM memberships WHERE userId = ?`,
      [user]
    )
  );
};

export const getUserMembershipsDetailed = async (user: User | number) => {
  const memberships: any = await getUserMemberships(user);
  for await (const membership of memberships) {
    membership.organization = await getOrganization(membership.organizationId);
  }
  return memberships;
};
