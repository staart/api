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
import ms from "ms";
import { capitalizeFirstAndLastLetter, createSlug } from "../helpers/utils";
import { KeyValue } from "../interfaces/general";
import { cachedQuery, deleteItemFromCache } from "../helpers/cache";
import { CacheCategories, ErrorCode, Webhooks } from "../interfaces/enum";
import { ApiKey } from "../interfaces/tables/organization";
import { getPaginatedData } from "./data";
import cryptoRandomString from "crypto-random-string";
import { apiKeyToken, invalidateToken } from "../helpers/jwt";
import {
  TOKEN_EXPIRY_API_KEY_MAX,
  JWT_ISSUER,
  ELASTIC_LOGS_PREFIX
} from "../config";
import { InsertResult } from "../interfaces/mysql";
import { Membership } from "../interfaces/tables/memberships";
import { getUser } from "./user";
import {
  elasticSearch,
  cleanElasticSearchQueryResponse
} from "../helpers/elasticsearch";
import randomColor from "randomcolor";
import axios from "axios";

/*
 * Create a new organization for a user
 */
export const createOrganization = async (organization: Organization) => {
  if (!organization.name) throw new Error(ErrorCode.INVALID_INPUT);
  organization.name = capitalizeFirstAndLastLetter(organization.name);
  organization.createdAt = new Date();
  organization.updatedAt = organization.createdAt;
  organization.username = createSlug(organization.name);
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex"
  }).replace("#", "");
  organization.profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (organization.name || "XX").substring(0, 2).toUpperCase()
  )}&background=${backgroundColor}&color=fff`;
  return await query(
    `INSERT INTO ${tableName("organizations")} ${tableValues(organization)}`,
    Object.values(organization)
  );
};

/*
 * Get the details of a specific organization
 */
export const getOrganization = async (id: string) => {
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
  id: string,
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
export const deleteOrganization = async (id: string) => {
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
  organizationId: string,
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
export const getApiKey = async (organizationId: string, apiKeyId: string) => {
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
 * Get an API key
 */
export const getApiKeyLogs = async (
  organizationId: string,
  apiKeyId: string,
  query: KeyValue
) => {
  await getApiKey(organizationId, apiKeyId);
  const range: string = query.range || "7d";
  const from = query.from ? parseInt(query.from) : 0;
  const result = await elasticSearch.search({
    index: `${ELASTIC_LOGS_PREFIX}*`,
    from,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                apiKeyId
              }
            },
            {
              range: {
                date: {
                  gte: new Date(new Date().getTime() - ms(range))
                }
              }
            }
          ]
        }
      },
      sort: [
        {
          date: { order: "desc" }
        }
      ],
      size: 10
    }
  });
  return cleanElasticSearchQueryResponse(result);
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
  organizationId: string,
  apiKeyId: string,
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
  organizationId: string,
  apiKeyId: string
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
  organizationId: string,
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
export const getDomain = async (organizationId: string, domainId: string) => {
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

export const updateOrganizationProfilePicture = async (
  organizationId: string
) => {
  const domains = await getOrganizationDomains(organizationId, {});
  if (domains && domains.data && domains.data.length) {
    const primaryDomain = domains.data[0] as Domain;
    const domainIcons = await axios.get(
      `https://unavatar.now.sh/${primaryDomain}?json`
    );
    if (
      domainIcons.data &&
      domainIcons.data.url &&
      domainIcons.data.url !== "http://unavatar.now.sh/fallback.png"
    )
      return await updateOrganization(organizationId, {
        profilePicture: domainIcons.data.url
      });
  }
  const organization = await getOrganization(organizationId);
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex"
  }).replace("#", "");
  const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    organization.name || organization.username || "XX"
  ).replace(
    /^([a-zA-Z0-9 _-]+)$/gi,
    ""
  )}&background=${backgroundColor}&color=fff`;
  await updateOrganization(organizationId, { profilePicture });
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
  const response = await query(
    `INSERT INTO ${tableName("domains")} ${tableValues(domain)}`,
    Object.values(domain)
  );
  await updateOrganizationProfilePicture(domain.organizationId);
  return response;
};

/**
 * Update a domain
 */
export const updateDomain = async (
  organizationId: string,
  domainId: string,
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
  organizationId: string,
  domainId: string
) => {
  const currentDomain = await getDomain(organizationId, domainId);
  const response = await query(
    `DELETE FROM ${tableName(
      "domains"
    )} WHERE id = ? AND organizationId = ? LIMIT 1`,
    [domainId, organizationId]
  );
  await updateOrganizationProfilePicture(organizationId);
  return response;
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
  organizationId: string,
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
  organizationId: string,
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
export const getWebhook = async (organizationId: string, webhookId: string) => {
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
  organizationId: string,
  webhookId: string,
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
  organizationId: string,
  webhookId: string
) => {
  const currentWebhook = await getWebhook(organizationId, webhookId);
  return await query(
    `DELETE FROM ${tableName(
      "webhooks"
    )} WHERE id = ? AND organizationId = ? LIMIT 1`,
    [webhookId, organizationId]
  );
};

/*
 * Get a detailed list of all members in an organization
 */
export const getOrganizationMemberships = async (
  organizationId: string,
  query?: KeyValue
) => {
  const members: any = await getPaginatedData({
    table: "memberships",
    conditions: { organizationId },
    ...query
  });
  for await (const member of members.data) {
    member.user = await getUser(member.userId);
  }
  return members;
};

/*
 * Get details about a specific organization membership
 */
export const getOrganizationMembership = async (
  organizationId: string,
  id: string
) => {
  return (<Membership[]>(
    await cachedQuery(
      CacheCategories.MEMBERSHIP,
      id,
      `SELECT * FROM ${tableName(
        "memberships"
      )} WHERE id = ? AND organizationId = ? LIMIT 1`,
      [id, organizationId]
    )
  ))[0];
};

/*
 * Get a detailed version of a membership
 */
export const getOrganizationMembershipDetailed = async (
  organizationId: string,
  id: string
) => {
  const membership = (await getOrganizationMembership(
    organizationId,
    id
  )) as any;
  if (!membership || !membership.id)
    throw new Error(ErrorCode.MEMBERSHIP_NOT_FOUND);
  membership.organization = await getOrganization(membership.organizationId);
  membership.user = await getUser(membership.userId);
  return membership;
};

/*
 * Update an organization membership for a user
 */
export const updateOrganizationMembership = async (
  organizationId: string,
  id: string,
  membership: KeyValue
) => {
  membership.updatedAt = new Date();
  membership = removeReadOnlyValues(membership);
  const membershipDetails = await getOrganizationMembership(organizationId, id);
  if (membershipDetails.id)
    deleteItemFromCache(
      CacheCategories.USER_MEMBERSHIPS,
      membershipDetails.userId
    );
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query(
    `UPDATE ${tableName("memberships")} SET ${setValues(
      membership
    )} WHERE id = ? AND organizationId = ?`,
    [...Object.values(membership), id, organizationId]
  );
};

/*
 * Delete an organization membership
 */
export const deleteOrganizationMembership = async (
  organizationId: string,
  id: string
) => {
  const membershipDetails = await getOrganizationMembership(organizationId, id);
  if (membershipDetails.id)
    deleteItemFromCache(
      CacheCategories.USER_MEMBERSHIPS,
      membershipDetails.userId
    );
  deleteItemFromCache(CacheCategories.MEMBERSHIP, id);
  return await query(
    `DELETE FROM ${tableName(
      "memberships"
    )} WHERE id = ? AND organizationId = ?`,
    [id, organizationId]
  );
};

/*
 * Delete all memberships in an organization
 */
export const deleteAllOrganizationMemberships = async (
  organizationId: string
) => {
  const allMemberships = await getOrganizationMemberships(organizationId);
  for await (const membership of allMemberships.data) {
    if (membership.id) {
      deleteItemFromCache(CacheCategories.USER_MEMBERSHIPS, membership.userId);
    }
  }
  return await query(
    `DELETE FROM ${tableName("memberships")} WHERE organizationId = ?`,
    [organizationId]
  );
};
