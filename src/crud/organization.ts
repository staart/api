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
import { ApiKey } from "../interfaces/tables/user";
import cryptoRandomString = require("crypto-random-string");

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

/**
 * Get a list of all approved locations of a user
 */
export const getOrganizationApiKeys = async (organizationId: number) => {
  return <ApiKey[]>(
    await cachedQuery(
      CacheCategories.API_KEYS,
      organizationId,
      "SELECT * FROM `api-keys` WHERE organizationId = ?",
      [organizationId]
    )
  );
};

/**
 * Get an API key without organization ID
 */
export const getApiKeyWithoutOrg = async (apiKey: string) => {
  return (<ApiKey[]>(
    await query("SELECT * FROM `api-keys` WHERE apiKey = ? LIMIT 1", [apiKey])
  ))[0];
};

/**
 * Get an API key
 */
export const getApiKey = async (organizationId: number, apiKey: string) => {
  return (<ApiKey[]>(
    await query(
      "SELECT * FROM `api-keys` WHERE apiKey = ? AND organizationId = ? LIMIT 1",
      [apiKey, organizationId]
    )
  ))[0];
};

/**
 * Get an API key/secret
 */
export const getApiKeyFromKeySecret = async (
  organizationId: number,
  apiKey: string,
  secretKey: string
) => {
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  return (<ApiKey[]>(
    await query(
      "SELECT * FROM `api-keys` WHERE apiKey = ? AND secretKey = ? AND organizationId = ? LIMIT 1",
      [apiKey, secretKey, organizationId]
    )
  ))[0];
};

/**
 * Create an API key
 */
export const createApiKey = async (apiKey: ApiKey) => {
  apiKey.apiKey = cryptoRandomString({ length: 20, type: "hex" });
  apiKey.secretKey = cryptoRandomString({ length: 20, type: "hex" });
  apiKey.createdAt = new Date();
  apiKey.updatedAt = apiKey.createdAt;
  deleteItemFromCache(CacheCategories.API_KEYS, apiKey.organizationId);
  return await query(
    `INSERT INTO \`api-keys\` ${tableValues(apiKey)}`,
    Object.values(apiKey)
  );
};

/**
 * Update a user's details
 */
export const updateApiKey = async (
  organizationId: number,
  apiKey: string,
  data: KeyValue
) => {
  const apiKeyDetails = await getApiKey(organizationId, apiKey);
  data.updatedAt = dateToDateTime(new Date());
  data = removeReadOnlyValues(data);
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  deleteItemFromCache(CacheCategories.API_KEYS, apiKeyDetails.organizationId);
  return await query(
    `UPDATE \`api-keys\` SET ${setValues(data)} WHERE apiKey = ?`,
    [...Object.values(data), apiKey]
  );
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (organizationId: number, apiKey: string) => {
  const apiKeyDetails = await getApiKey(organizationId, apiKey);
  deleteItemFromCache(CacheCategories.API_KEY, apiKey);
  deleteItemFromCache(CacheCategories.API_KEYS, apiKeyDetails.organizationId);
  return await query("DELETE FROM `api-keys` WHERE apiKey = ? LIMIT 1", [
    apiKey
  ]);
};
