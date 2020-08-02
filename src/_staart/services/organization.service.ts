import {
  cleanElasticSearchQueryResponse,
  elasticSearch,
} from "@staart/elasticsearch";
import {
  INVALID_INPUT,
  ORGANIZATION_NOT_FOUND,
  USERNAME_EXISTS,
  RESOURCE_NOT_FOUND,
} from "@staart/errors";
import { ms } from "@staart/text";
import {
  capitalizeFirstAndLastLetter,
  createSlug,
  randomString,
  slugify,
} from "@staart/text";
import axios from "axios";
import randomColor from "randomcolor";
import {
  ELASTIC_LOGS_INDEX,
  JWT_ISSUER,
  TOKEN_EXPIRY_API_KEY_MAX,
} from "../../config";
import { apiKeyToken, invalidateToken } from "../helpers/jwt";
import { KeyValue } from "../interfaces/general";
import { prisma } from "../helpers/prisma";
import {
  organizationsCreateInput,
  organizationsUpdateInput,
  apiKeysCreateInput,
  apiKeysUpdateInput,
  domainsCreateInput,
  organizations,
} from "@prisma/client";
import {
  getItemFromCache,
  setItemInCache,
  deleteItemFromCache,
} from "../helpers/cache";

/**
 * Check if an organization username is available
 */
export const checkOrganizationUsernameAvailability = async (
  username: string
) => {
  return (
    (
      await prisma.organizations.findMany({
        where: { username },
      })
    ).length === 0
  );
};

const getBestUsernameForOrganization = async (name: string) => {
  let available = false;
  let result = slugify(name.trim());
  if (result && checkOrganizationUsernameAvailability(result)) available = true;
  while (!available) {
    result = createSlug(name.trim());
    if (checkOrganizationUsernameAvailability(result)) available = true;
  }
  return result;
};

/*
 * Create a new organization for a user
 */
export const createOrganization = async (
  organization: organizationsCreateInput,
  ownerId: string
) => {
  if (!organization.name) throw new Error(INVALID_INPUT);
  organization.name = capitalizeFirstAndLastLetter(organization.name);
  organization.username = await getBestUsernameForOrganization(
    organization.name
  );
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex",
  }).replace("#", "");
  organization.profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (organization.name || "XX").substring(0, 2).toUpperCase()
  )}&background=${backgroundColor}&color=fff`;
  try {
    const result = await prisma.organizations.create({
      data: organization,
    });
    await prisma.memberships.create({
      data: {
        role: "OWNER",
        user: { connect: { id: parseInt(ownerId) } },
        organization: { connect: { id: result.id } },
      },
    });
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

/*
 * Update an organization
 */
export const updateOrganization = async (
  id: string | number,
  organization: organizationsUpdateInput
) => {
  if (typeof id === "number") id = id.toString();
  const originalOrganization = await getOrganizationById(id);
  await deleteItemFromCache(
    `cache_getOrganizationById_${originalOrganization.id}`,
    `cache_getOrganizationByUsername_${originalOrganization.username}`
  );
  if (!originalOrganization) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    organization.username &&
    originalOrganization.username &&
    organization.username !== originalOrganization.username
  ) {
    const currentOwners = await prisma.organizations.findMany({
      where: { username: originalOrganization.username },
    });
    if (currentOwners.length) {
      const currentOwnerId = currentOwners[0].id;
      if (currentOwnerId !== parseInt(id)) throw new Error(USERNAME_EXISTS);
    }
  }
  return prisma.organizations.update({
    data: organization,
    where: { id: parseInt(id) },
  });
};

/**
 * Get an API key
 */
export const getApiKeyLogs = async (apiKeyId: string, query: KeyValue) => {
  const range: string = query.range || "7d";
  const from = query.from ? parseInt(query.from) : 0;
  const result = await elasticSearch.search({
    index: ELASTIC_LOGS_INDEX,
    from,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                apiKeyId,
              },
            },
            {
              range: {
                date: {
                  gte: new Date(new Date().getTime() - ms(range)),
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          date: { order: "desc" },
        },
      ],
      size: 10,
    },
  });
  return cleanElasticSearchQueryResponse(result.body, 10);
};

/**
 * Create an API key
 */
export const createApiKey = async (apiKey: apiKeysCreateInput) => {
  apiKey.expiresAt = apiKey.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
  apiKey.jwtApiKey = await apiKeyToken(apiKey);
  return prisma.apiKeys.create({ data: apiKey });
};

/**
 * Update a user's details
 */
export const updateApiKey = async (
  apiKeyId: string,
  data: apiKeysUpdateInput
) => {
  const apiKey = await prisma.apiKeys.findOne({
    where: { id: parseInt(apiKeyId) },
  });
  if (!apiKey) throw new Error(RESOURCE_NOT_FOUND);
  if (apiKey.jwtApiKey) await invalidateToken(apiKey.jwtApiKey);
  data.jwtApiKey = await apiKeyToken({ ...apiKey, ...data });
  return prisma.apiKeys.update({ data, where: { id: parseInt(apiKeyId) } });
};

/**
 * Get a domain
 */
export const getDomainByDomainName = async (domain: string) => {
  const domainDetails = await prisma.domains.findMany({
    where: { domain, isVerified: true },
    first: 1,
  });
  if (domainDetails.length) return domainDetails[0];
  throw new Error(RESOURCE_NOT_FOUND);
};

export const refreshOrganizationProfilePicture = async (
  organizationId: string | number
) => {
  if (typeof organizationId === "number")
    organizationId = organizationId.toString();
  const domains = await prisma.domains.findMany({
    where: { organizationId: parseInt(organizationId) },
    orderBy: { updatedAt: "desc" },
  });
  if (domains.length) {
    const domainIcons = await axios.get<{ url?: string }>(
      `https://unavatar.now.sh/${domains[0].domain}?json`
    );
    if (
      domainIcons.data &&
      domainIcons.data.url &&
      domainIcons.data.url !== "http://unavatar.now.sh/fallback.png"
    )
      return prisma.organizations.update({
        data: { profilePicture: domainIcons.data.url },
        where: { id: parseInt(organizationId) },
      });
  }
  const organization = await prisma.organizations.findOne({
    where: { id: parseInt(organizationId) },
    select: { name: true, username: true },
  });
  if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex",
  }).replace("#", "");
  const profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    organization.name || organization.username || "XX"
  ).replace(
    /^([a-zA-Z0-9 _-]+)$/gi,
    ""
  )}&background=${backgroundColor}&color=fff`;
  return prisma.organizations.update({
    data: { profilePicture },
    where: { id: parseInt(organizationId) },
  });
};

/**
 * Create a domain
 */
export const createDomain = async (domain: domainsCreateInput) => {
  domain.verificationCode = `${JWT_ISSUER}=${randomString({
    length: 32,
  })}`;
  const response = await prisma.domains.create({ data: domain });
  await refreshOrganizationProfilePicture(response.organizationId);
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
 * Get a organization object from its ID
 * @param id - User ID
 */
export const getOrganizationById = async (id: number | string) => {
  if (typeof id === "number") id = id.toString();
  const key = `cache_getOrganizationById_${id}`;
  try {
    return await getItemFromCache<organizations>(key);
  } catch (error) {
    const organization = await prisma.organizations.findOne({
      where: { id: parseInt(id) },
    });
    if (organization) {
      await setItemInCache(key, organization);
      return organization;
    }
    throw new Error(ORGANIZATION_NOT_FOUND);
  }
};

/**
 * Get a organization object from its username
 * @param username - User's username
 */
export const getOrganizationByUsername = async (username: string) => {
  const key = `cache_getOrganizationByUsername_${username}`;
  try {
    return await getItemFromCache<organizations>(key);
  } catch (error) {
    const organization = await prisma.organizations.findOne({
      where: { username },
    });
    if (organization) {
      await setItemInCache(key, organization);
      return organization;
    }
    throw new Error(ORGANIZATION_NOT_FOUND);
  }
};
