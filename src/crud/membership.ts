import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues,
  tableName
} from "../helpers/mysql";
import { Membership } from "../interfaces/tables/memberships";
import { KeyValue } from "../interfaces/general";
import { User } from "../interfaces/tables/user";
import { getOrganization } from "./organization";
import { CacheCategories } from "../interfaces/enum";
import { deleteItemFromCache, cachedQuery } from "../helpers/cache";
import { getUser } from "./user";
import { Organization } from "../interfaces/tables/organization";
import {
  MEMBERSHIP_NOT_FOUND,
  USER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND
} from "@staart/errors";

/*
 * Create a new organization membership for a user
 */
export const createMembership = async (membership: Membership) => {
  membership.createdAt = new Date();
  membership.updatedAt = membership.createdAt;
  deleteItemFromCache(CacheCategories.USER_MEMBERSHIPS, membership.userId);
  return await query(
    `INSERT INTO ${tableName("memberships")} ${tableValues(membership)}`,
    Object.values(membership)
  );
};

/*
 * Update an organization membership for a user
 */
export const updateMembership = async (id: string, membership: KeyValue) => {
  membership.updatedAt = new Date();
  membership = removeReadOnlyValues(membership);
  const membershipDetails = await getMembership(id);
  if (membershipDetails.id)
    deleteItemFromCache(
      CacheCategories.USER_MEMBERSHIPS,
      membershipDetails.userId
    );
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query(
    `UPDATE ${tableName("memberships")} SET ${setValues(
      membership
    )} WHERE id = ?`,
    [...Object.values(membership), id]
  );
};

/*
 * Delete an organization membership
 */
export const deleteMembership = async (id: string) => {
  const membershipDetails = await getMembership(id);
  if (membershipDetails.id)
    deleteItemFromCache(
      CacheCategories.USER_MEMBERSHIPS,
      membershipDetails.userId
    );
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query(`DELETE FROM ${tableName("memberships")} WHERE id = ?`, [
    id
  ]);
};

/*
 * Delete all memberships for a user
 */
export const deleteAllUserMemberships = async (userId: string) => {
  const allMemberships = await getUserMemberships(userId);
  for await (const membership of allMemberships) {
    if (membership.id) {
      deleteItemFromCache(CacheCategories.USER_MEMBERSHIPS, membership.userId);
    }
  }
  return await query(
    `DELETE FROM ${tableName("memberships")} WHERE userId = ?`,
    [userId]
  );
};

/*
 * Get details about a specific organization membership
 */
export const getMembership = async (id: string) => {
  return (<Membership[]>(
    await cachedQuery(
      CacheCategories.MEMBERSHIP,
      id,
      `SELECT * FROM ${tableName("memberships")} WHERE id = ? LIMIT 1`,
      [id]
    )
  ))[0];
};

/*
 * Get a detailed version of a membership
 */
export const getMembershipDetailed = async (id: string) => {
  const membership = await getMembership(id);
  if (!membership || !membership.id) throw new Error(MEMBERSHIP_NOT_FOUND);
  const membershipDetailed = {
    ...membership,
    organization: await getOrganization(membership.organizationId),
    user: await getUser(membership.userId)
  };
  return membershipDetailed;
};

/*
 * Get a list of all members in an organization
 */
export const getOrganizationMembers = async (organizationId: string) => {
  return <Membership[]>(
    await query(
      `SELECT * FROM ${tableName("memberships")} WHERE organizationId = ?`,
      [organizationId]
    )
  );
};

export const getUserMemberships = async (user: User | string) => {
  if (typeof user !== "string" && typeof user !== "string") {
    if (user.id) user = user.id;
    else throw new Error(USER_NOT_FOUND);
  }
  return <Membership[]>(
    await cachedQuery(
      CacheCategories.USER_MEMBERSHIPS,
      user,
      `SELECT * FROM ${tableName("memberships")} WHERE userId = ?`,
      [user]
    )
  );
};

/**
 * Add organization details to membership
 */
export const addOrganizationToMembership = async (membership: Membership) => {
  (membership as any).organization = await getOrganization(
    membership.organizationId
  );
  return membership;
};

/**
 * Add organization details to memberships
 */
export const addOrganizationToMemberships = async (
  memberships: Membership[]
) => {
  for await (const membership of memberships) {
    (membership as any).organization = await getOrganization(
      membership.organizationId
    );
  }
  return memberships;
};

/**
 * Get a detailed object of a user's membership
 */
export const getUserMembershipsDetailed = async (user: User | string) => {
  const memberships: any = await getUserMemberships(user);
  for await (const membership of memberships) {
    membership.organization = await getOrganization(membership.organizationId);
  }
  return memberships;
};

/**
 * Get a user membership of a particular organization
 */
export const getUserOrganizationMembership = async (
  user: User | string,
  organization: Organization | string
) => {
  if (typeof user !== "string" && typeof user !== "string") {
    if (user.id) user = user.id;
    else throw new Error(USER_NOT_FOUND);
  }
  if (typeof organization !== "string" && typeof organization !== "string") {
    if (organization.id) organization = organization.id;
    else throw new Error(ORGANIZATION_NOT_FOUND);
  }
  return (<Membership[]>(
    await query(
      `SELECT * FROM ${tableName(
        "memberships"
      )} WHERE userId = ? AND organizationId = ?`,
      [user, organization]
    )
  ))[0];
};
