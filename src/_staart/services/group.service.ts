import {
  apiKeysCreateInput,
  apiKeysUpdateInput,
  domainsCreateInput,
  groups,
  groupsCreateInput,
  groupsUpdateInput,
} from "@prisma/client";
import {
  cleanElasticSearchQueryResponse,
  elasticSearch,
} from "@staart/elasticsearch";
import {
  INVALID_INPUT,
  ORGANIZATION_NOT_FOUND,
  RESOURCE_NOT_FOUND,
} from "@staart/errors";
import { capitalizeFirstAndLastLetter, ms, randomString } from "@staart/text";
import axios from "axios";
import randomColor from "randomcolor";
import {
  ELASTIC_LOGS_INDEX,
  JWT_ISSUER,
  TOKEN_EXPIRY_API_KEY_MAX,
} from "../../config";
import {
  deleteItemFromCache,
  getItemFromCache,
  setItemInCache,
} from "../helpers/cache";
import { prisma } from "../helpers/prisma";
import { KeyValue } from "../interfaces/general";

/*
 * Create a new group for a user
 */
export const createGroup = async (
  group: groupsCreateInput,
  ownerId: number
) => {
  if (!group.name) throw new Error(INVALID_INPUT);
  group.name = capitalizeFirstAndLastLetter(group.name);
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex",
  }).replace("#", "");
  group.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (group.name || "XX").substring(0, 2).toUpperCase()
  )}&background=${backgroundColor}&color=fff`;
  const result = await prisma.groups.create({
    data: group,
  });
  await prisma.memberships.create({
    data: {
      role: "OWNER",
      user: { connect: { id: ownerId } },
      group: { connect: { id: result.id } },
    },
  });
  return result;
};

/*
 * Update an group
 */
export const updateGroup = async (id: number, group: groupsUpdateInput) => {
  const originalGroup = await getGroupById(id);
  await deleteItemFromCache(`cache_getGroupById_${originalGroup.id}`);
  if (!originalGroup) throw new Error(ORGANIZATION_NOT_FOUND);
  return prisma.groups.update({
    data: group,
    where: { id: id },
  });
};

/**
 * Get an API key
 */
export const getApiKeyLogs = async (apiKeyId: number, query: KeyValue) => {
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
  apiKey.apiKey = randomString({ length: 24 });
  return prisma.apiKeys.create({ data: apiKey });
};

/**
 * Update a user's details
 */
export const updateApiKey = async (
  apiKeyId: number,
  data: apiKeysUpdateInput
) => {
  const apiKey = await prisma.apiKeys.findOne({
    where: { id: apiKeyId },
  });
  if (!apiKey) throw new Error(RESOURCE_NOT_FOUND);
  return prisma.apiKeys.update({ data, where: { id: apiKeyId } });
};

/**
 * Get a domain
 */
export const getDomainByDomainName = async (domain: string) => {
  const domainDetails = await prisma.domains.findMany({
    where: { domain, isVerified: true },
    take: 1,
  });
  if (domainDetails.length) return domainDetails[0];
  throw new Error(RESOURCE_NOT_FOUND);
};

export const refreshGroupProfilePicture = async (groupId: number) => {
  const domains = await prisma.domains.findMany({
    where: { groupId: groupId },
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
      return prisma.groups.update({
        data: { profilePictureUrl: domainIcons.data.url },
        where: { id: groupId },
      });
  }
  const group = await prisma.groups.findOne({
    where: { id: groupId },
    select: { name: true },
  });
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  const backgroundColor = randomColor({
    luminosity: "dark",
    format: "hex",
  }).replace("#", "");
  const profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    group.name || "XX"
  ).replace(
    /^([a-zA-Z0-9 _-]+)$/gi,
    ""
  )}&background=${backgroundColor}&color=fff`;
  return prisma.groups.update({
    data: { profilePictureUrl },
    where: { id: groupId },
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
  refreshGroupProfilePicture(response.groupId)
    .then(() => {})
    .catch(() => {});
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
 * Get a group object from its ID
 * @param id - User ID
 */
export const getGroupById = async (id: number) => {
  const key = `cache_getGroupById_${id}`;
  try {
    return await getItemFromCache<groups>(key);
  } catch (error) {
    const group = await prisma.groups.findOne({
      where: { id },
    });
    if (group) {
      await setItemInCache(key, group);
      return group;
    }
    throw new Error(ORGANIZATION_NOT_FOUND);
  }
};
