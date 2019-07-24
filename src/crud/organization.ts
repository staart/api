import {
  query,
  tableValues,
  setValues,
  removeReadOnlyValues,
  tableName
} from "../helpers/mysql";
import {
  Organization,
  Domain,
  Webhook
} from "../interfaces/tables/organization";
import { capitalizeFirstAndLastLetter, createSlug } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";
import { CacheCategories, ErrorCode, Webhooks } from "../interfaces/enum";
import { ApiKey } from "../interfaces/tables/organization";
import { getPaginatedData } from "./data";
import cryptoRandomString from "crypto-random-string";
import { apiKeyToken, invalidateToken } from "../helpers/jwt";
import { TOKEN_EXPIRY_API_KEY_MAX, JWT_ISSUER } from "../config";
import { InsertResult } from "../interfaces/mysql";

/*
 * Create a new organization for a user
 */
export const createOrganization = async (organization: Organization) => {
  if (!organization.name) throw new Error(ErrorCode.INVALID_INPUT);
  organization.name = capitalizeFirstAndLastLetter(organization.name);
  organization.createdAt = new Date();
  organization.updatedAt = organization.createdAt;
  organization.username = createSlug(organization.name);
  // Create organization
  return await query(
    `INSERT INTO ${tableName("organizations")} ${tableValues(organization)}`,
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
      `SELECT * FROM ${tableName("organizations")} WHERE id = ? LIMIT 1`,
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
      `SELECT id FROM ${tableName("organizations")} WHERE username = ? LIMIT 1`,
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
  organization.updatedAt = new Date();
  organization = removeReadOnlyValues(organization);
  const originalOrganization = await getOrganization(id);
  if (
    organization.username &&
    originalOrganization.username &&
    organization.username !== originalOrganization.username
  ) {
    const currentOwner = await getOrganizationIdFromUsername(
      originalOrganization.username
    );
    if (currentOwner != id) throw new Error(ErrorCode.USERNAME_EXISTS);
    deleteItemFromCache(
      CacheCategories.ORGANIZATION_USERNAME,
      originalOrganization.username
    );
  }
  deleteItemFromCache(CacheCategories.ORGANIZATION, id);
  return await query(
    `UPDATE ${tableName("organizations")} SET ${setValues(
      organization
    )} WHERE id = ?`,
    [...Object.values(organization), id]
  );
};

/*
 * Delete an organization
 */
export const deleteOrganization = async (id: number) => {
  deleteItemFromCache(CacheCategories.ORGANIZATION, id);
  return await query(`DELETE FROM ${tableName("organizations")} WHERE id = ?`, [
    id
  ]);
};

/*
 * Get all ${tableName("organizations")}
 */
export const getAllOrganizations = async () => {
  return <Organization[]>(
    await query(`SELECT * FROM ${tableName("organizations")}`)
  );
};

/**
 * Get a list of all approved locations of a user
 */
export const getOrganizationApiKeys = async (
  organizationId: number,
  query: KeyValue
) => {
  return await getPaginatedData({
    table: "api-keys",
    conditions: {
      organizationId
    },
    ...query
  });
};

/**
 * Get an API key
 */
export const getApiKey = async (organizationId: number, apiKeyId: number) => {
  return (<ApiKey[]>(
    await query(
      `SELECT * FROM ${tableName(
        "api-keys"
      )} WHERE id = ? AND organizationId = ? LIMIT 1`,
      [apiKeyId, organizationId]
    )
  ))[0];
};

/**
 * Create an API key
 */
export const createApiKey = async (apiKey: ApiKey) => {
  apiKey.expiresAt = apiKey.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
  apiKey.createdAt = new Date();
  apiKey.updatedAt = apiKey.createdAt;
  apiKey.jwtApiKey = await apiKeyToken(apiKey);
  return await query(
    `INSERT INTO ${tableName("api-keys")} ${tableValues(apiKey)}`,
    Object.values(apiKey)
  );
};

/**
 * Update a user's details
 */
export const updateApiKey = async (
  organizationId: number,
  apiKeyId: number,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  const apiKey = await getApiKey(organizationId, apiKeyId);
  if (apiKey.jwtApiKey) await invalidateToken(apiKey.jwtApiKey);
  data.jwtApiKey = await apiKeyToken({ ...apiKey, ...data });
  return await query(
    `UPDATE ${tableName("api-keys")} SET ${setValues(
      data
    )} WHERE id = ? AND organizationId = ?`,
    [...Object.values(data), apiKeyId, organizationId]
  );
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (
  organizationId: number,
  apiKeyId: number
) => {
  const currentApiKey = await getApiKey(organizationId, apiKeyId);
  if (currentApiKey.jwtApiKey) await invalidateToken(currentApiKey.jwtApiKey);
  return await query(
    `DELETE FROM ${tableName(
      "api-keys"
    )} WHERE id = ? AND organizationId = ? LIMIT 1`,
    [apiKeyId, organizationId]
  );
};

/**
 * Get a list of domains for an organization
 */
export const getOrganizationDomains = async (
  organizationId: number,
  query: KeyValue
) => {
  return await getPaginatedData({
    table: "domains",
    conditions: {
      organizationId
    },
    ...query
  });
};

/**
 * Get a domain
 */
export const getDomain = async (organizationId: number, domainId: number) => {
  return (<Domain[]>(
    await query(
      `SELECT * FROM ${tableName(
        "domains"
      )} WHERE id = ? AND organizationId = ? LIMIT 1`,
      [domainId, organizationId]
    )
  ))[0];
};

/**
 * Get a domain
 */
export const getDomainByDomainName = async (domain: string) => {
  return (<Domain[]>(
    await query(
      `SELECT * FROM ${tableName(
        "domains"
      )} WHERE domain = ? AND isVerified = ? LIMIT 1`,
      [domain, true]
    )
  ))[0];
};

/**
 * Create a domain
 */
export const createDomain = async (domain: Domain): Promise<InsertResult> => {
  domain.createdAt = new Date();
  domain.updatedAt = domain.createdAt;
  domain.verificationCode = `${JWT_ISSUER}=${cryptoRandomString({
    length: 32
  })}`;
  return await query(
    `INSERT INTO ${tableName("domains")} ${tableValues(domain)}`,
    Object.values(domain)
  );
};

/**
 * Update a domain
 */
export const updateDomain = async (
  organizationId: number,
  domainId: number,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  const domain = await getDomain(organizationId, domainId);
  return await query(
    `UPDATE ${tableName("domains")} SET ${setValues(
      data
    )} WHERE id = ? AND organizationId = ?`,
    [...Object.values(data), domainId, organizationId]
  );
};

/**
 * Delete a domain
 */
export const deleteDomain = async (
  organizationId: number,
  domainId: number
) => {
  const currentDomain = await getDomain(organizationId, domainId);
  return await query(
    `DELETE FROM ${tableName(
      "domains"
    )} WHERE id = ? AND organizationId = ? LIMIT 1`,
    [domainId, organizationId]
  );
};

/**
 * Get a user by their username
 */
export const checkDomainAvailability = async (username: string) => {
  try {
    const domain = await getDomainByDomainName(username);
    if (domain && domain.id) return false;
  } catch (error) {}
  return true;
};

/**
 * Get a list of webhooks for an organization
 */
export const getOrganizationWebhooks = async (
  organizationId: number,
  query: KeyValue
) => {
  return await getPaginatedData({
    table: "webhooks",
    conditions: {
      organizationId
    },
    ...query
  });
};

/**
 * Get a webhook
 */
export const getOrganizationEventWebhooks = async (
  organizationId: number,
  event: Webhooks
) => {
  return <Webhook[]>(
    await query(
      `SELECT * FROM ${tableName(
        "webhooks"
      )} WHERE organizationId = ? AND (event = ? OR event = "*")`,
      [organizationId, event]
    )
  );
};

/**
 * Get a webhook
 */
export const getWebhook = async (organizationId: number, webhookId: number) => {
  return (<Webhook[]>(
    await query(
      `SELECT * FROM ${tableName(
        "webhooks"
      )} WHERE id = ? AND organizationId = ? LIMIT 1`,
      [webhookId, organizationId]
    )
  ))[0];
};

/**
 * Create a webhook
 */
export const createWebhook = async (
  webhook: Webhook
): Promise<InsertResult> => {
  webhook.contentType = webhook.contentType || "application/json";
  webhook.isActive = webhook.isActive !== false;
  webhook.createdAt = new Date();
  webhook.updatedAt = webhook.createdAt;
  return await query(
    `INSERT INTO ${tableName("webhooks")} ${tableValues(webhook)}`,
    Object.values(webhook)
  );
};

/**
 * Update a webhook
 */
export const updateWebhook = async (
  organizationId: number,
  webhookId: number,
  data: KeyValue
) => {
  data.updatedAt = new Date();
  data = removeReadOnlyValues(data);
  const webhook = await getWebhook(organizationId, webhookId);
  return await query(
    `UPDATE ${tableName("webhooks")} SET ${setValues(
      data
    )} WHERE id = ? AND organizationId = ?`,
    [...Object.values(data), webhookId, organizationId]
  );
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (
  organizationId: number,
  webhookId: number
) => {
  const currentWebhook = await getWebhook(organizationId, webhookId);
  return await query(
    `DELETE FROM ${tableName(
      "webhooks"
    )} WHERE id = ? AND organizationId = ? LIMIT 1`,
    [webhookId, organizationId]
  );
};
