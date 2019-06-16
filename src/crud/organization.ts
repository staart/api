import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues
} from "../helpers/mysql";
import { Organization } from "../interfaces/tables/organization";
import { capitalizeFirstAndLastLetter, dateToDateTime } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";
import { CacheCategories, ErrorCode } from "../interfaces/enum";

/*
 * Create a new organization for a user
 */
export const createOrganization = async (organization: Organization) => {
  if (organization.name)
    organization.name = capitalizeFirstAndLastLetter(organization.name);
  organization.createdAt = new Date();
  organization.updatedAt = organization.createdAt;
  // Create organization
  return await query(
    `INSERT INTO organizations ${tableValues(organization)}`,
    Object.values(organization)
  );
};

/*
 * Get the details of a specific organization
 */
export const getOrganization = async (id: number) => {
  const org = (<Organization[]>(
    await cachedQuery(
      CacheCategories.ORGANIZATION,
      id,
      `SELECT * FROM organizations WHERE id = ? LIMIT 1`,
      [id]
    )
  ))[0];
  if (org) return org;
  throw new Error(ErrorCode.ORGANIZATION_NOT_FOUND);
};

/*
 * Get the details of a specific organization
 */
export const getOrganizationIdFromUsername = async (username: string) => {
  const org = (<Organization[]>(
    await cachedQuery(
      CacheCategories.ORGANIZATION_USERNAME,
      username,
      `SELECT id FROM organizations WHERE username = ? LIMIT 1`,
      [username]
    )
  ))[0];
  if (org && org.id) return org.id;
  throw new Error(ErrorCode.ORGANIZATION_NOT_FOUND);
};

/*
 * Update an organization
 */
export const updateOrganization = async (
  id: number,
  organization: KeyValue
) => {
  organization.updatedAt = dateToDateTime(new Date());
  organization = removeReadOnlyValues(organization);
  deleteItemFromCache(CacheCategories.ORGANIZATION, id);
  return await query(
    `UPDATE organizations SET ${setValues(organization)} WHERE id = ?`,
    [...Object.values(organization), id]
  );
};

/*
 * Delete an organization
 */
export const deleteOrganization = async (id: number) => {
  deleteItemFromCache(CacheCategories.ORGANIZATION, id);
  return await query("DELETE FROM organizations WHERE id = ?", [id]);
};

/*
 * Get all organizations
 */
export const getAllOrganizations = async () => {
  return <Organization[]>await query("SELECT * FROM organizations");
};
