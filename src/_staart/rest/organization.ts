import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_INVITE_DOMAIN,
  DOMAIN_ALREADY_VERIFIED,
  INVALID_INPUT,
  DOMAIN_MISSING_DNS,
  DOMAIN_MISSING_FILE,
  DOMAIN_UNABLE_TO_VERIFY,
  INSUFFICIENT_PERMISSION,
  MEMBERSHIP_NOT_FOUND,
  STRIPE_NO_CUSTOMER,
  USER_IS_MEMBER_ALREADY,
  USER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  RESOURCE_NOT_FOUND,
} from "@staart/errors";
import {
  createCustomer,
  createSource,
  createSubscription,
  deleteCustomer,
  deleteSource,
  getCustomer,
  getInvoice,
  getInvoices,
  getProductPricing,
  getSource,
  getSources,
  getSubscription,
  getSubscriptions,
  updateCustomer,
  updateSource,
  updateSubscription,
  createCustomerBalanceTransaction,
  getCustomBalanceTransactions,
  getCustomBalanceTransaction,
} from "@staart/payments";
import axios from "axios";
import { JWT_ISSUER, TOKEN_EXPIRY_API_KEY_MAX } from "../../config";
import { can } from "../helpers/authorization";
import {
  ApiKeyResponse,
  verifyToken,
  checkInvalidatedToken,
  invalidateToken,
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { trackEvent } from "../helpers/tracking";
import { dnsResolve } from "../helpers/utils";
import { queueWebhook } from "../helpers/webhooks";
import { OrgScopes, Templates, Webhooks, Tokens } from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { register } from "./auth";
import {
  prisma,
  paginatedResult,
  queryParamsToSelect,
} from "../helpers/prisma";
import {
  groupsCreateInput,
  groupsUpdateInput,
  membershipsInclude,
  membershipsSelect,
  membershipsOrderByInput,
  membershipsWhereUniqueInput,
  membershipsUpdateInput,
  users,
  MembershipRole,
  apiKeysSelect,
  apiKeysInclude,
  apiKeysOrderByInput,
  apiKeysWhereUniqueInput,
  apiKeysUpdateInput,
  apiKeysCreateInput,
  webhooksCreateInput,
  domainsSelect,
  domainsInclude,
  domainsOrderByInput,
  domainsWhereUniqueInput,
  domainsUpdateInput,
  domainsCreateInput,
  webhooksSelect,
  webhooksInclude,
  webhooksOrderByInput,
  webhooksWhereUniqueInput,
  webhooksUpdateInput,
} from "@prisma/client";
import {
  getDomainByDomainName,
  getApiKeyLogs,
  checkDomainAvailability,
  getOrganizationById,
  createOrganization,
} from "../services/group.service";
import { randomString } from "@staart/text";
import { fireSingleWebhook } from "../helpers/webhooks";
import { getUserById } from "../services/user.service";
import { deleteItemFromCache } from "../helpers/cache";

export const getOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG, "group", groupId))
    return getOrganizationById(groupId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: string,
  group: groupsCreateInput,
  locals: Locals
) => {
  if (!(group.name || "").trim()) {
    const user = await getUserById(userId);
    group.name = user.name;
  }
  return createOrganization(group, userId);
};

export const updateOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  data: groupsUpdateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG, "group", groupId)) {
    const result = await prisma.groups.update({
      where: {
        id: parseInt(groupId),
      },
      data,
    });
    queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_ORGANIZATION }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG, "group", groupId)) {
    const groupDetails = await getOrganizationById(groupId);
    await deleteItemFromCache(
      `cache_getOrganizationById_${groupDetails.id}`,
      `cache_getOrganizationByUsername_${groupDetails.username}`
    );
    if (groupDetails.stripeCustomerId)
      await deleteCustomer(groupDetails.stripeCustomerId);
    await prisma.groups.delete({
      where: {
        id: parseInt(groupId),
      },
    });
    queueWebhook(groupId, Webhooks.DELETE_ORGANIZATION);
    trackEvent({ groupId, type: Webhooks.DELETE_ORGANIZATION }, locals);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationBillingForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_BILLING, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) return getCustomer(group.stripeCustomerId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationBillingForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  data: any,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_BILLING, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    let result;
    if (group.stripeCustomerId) {
      result = await updateCustomer(group.stripeCustomerId, data);
    } else {
      result = await createCustomer(
        groupId,
        data,
        (groupId: string, data: groupsUpdateInput) =>
          prisma.groups.update({
            where: {
              id: parseInt(groupId),
            },
            data,
          })
      );
    }
    queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION_BILLING, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_ORGANIZATION_BILLING }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoicesForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  params: KeyValue
) => {
  if (await can(userId, OrgScopes.READ_ORG_INVOICES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getInvoices(group.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoiceForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  invoiceId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_INVOICES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getInvoice(group.stripeCustomerId, invoiceId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourcesForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  params: KeyValue
) => {
  if (await can(userId, OrgScopes.READ_ORG_SOURCES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getSources(group.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  sourceId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_SOURCES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getSource(group.stripeCustomerId, sourceId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSubscriptionsForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  params: KeyValue
) => {
  if (await can(userId, OrgScopes.READ_ORG_SUBSCRIPTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getSubscriptions(group.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSubscriptionForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  subscriptionId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_SUBSCRIPTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getSubscription(group.stripeCustomerId, subscriptionId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationSubscriptionForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  subscriptionId: string,
  data: KeyValue,
  locals?: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_SUBSCRIPTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) {
      const result = await updateSubscription(
        group.stripeCustomerId,
        subscriptionId,
        data
      );
      queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION, data);
      trackEvent(
        { groupId, type: Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION },
        locals
      );
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createOrganizationSubscriptionForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  params: { plan: string; [index: string]: any },
  locals?: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_SUBSCRIPTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) {
      const result = await createSubscription(group.stripeCustomerId, params);
      queueWebhook(groupId, Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION, params);
      trackEvent(
        { groupId, type: Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION },
        locals
      );
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_PLANS, "group", groupId))
    return getProductPricing();
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  sourceId: string,
  locals?: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG_SOURCES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) {
      const result = await deleteSource(group.stripeCustomerId, sourceId);
      queueWebhook(groupId, Webhooks.DELETE_ORGANIZATION_SOURCE, sourceId);
      trackEvent(
        { groupId, type: Webhooks.DELETE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  sourceId: string,
  data: any,
  locals?: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_SOURCES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) {
      const result = await updateSource(group.stripeCustomerId, sourceId, data);
      queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION_SOURCE, data);
      trackEvent(
        { groupId, type: Webhooks.UPDATE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  card: any,
  locals?: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_SOURCES, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId) {
      const result = await createSource(group.stripeCustomerId, card);
      queueWebhook(groupId, Webhooks.CREATE_ORGANIZATION_SOURCE, card);
      trackEvent(
        { groupId, type: Webhooks.CREATE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getAllOrganizationDataForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_TRANSACTIONS, "group", groupId)) {
    const group = await prisma.groups.findOne({
      where: {
        id: parseInt(groupId),
      },
      include: {
        apiKeys: true,
        domains: true,
        memberships: true,
        webhooks: true,
      },
    });
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    return {
      ...group,
      ...(group.stripeCustomerId
        ? {
            billing: await getCustomer(group.stripeCustomerId),
            subscriptions: await getSubscriptions(group.stripeCustomerId, {}),
            invoices: await getInvoices(group.stripeCustomerId, {}),
            sources: await getSources(group.stripeCustomerId, {}),
          }
        : {}),
    };
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  queryParams: any
) => {
  if (await can(userId, OrgScopes.READ_ORG_MEMBERSHIPS, "group", groupId))
    return paginatedResult(
      await prisma.memberships.findMany({
        where: { groupId: parseInt(groupId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  membershipId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_MEMBERSHIPS, "group", groupId))
    return prisma.memberships.findOne({
      where: { id: parseInt(membershipId) },
      include: { user: true },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  membershipId: string,
  data: membershipsUpdateInput
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_MEMBERSHIPS, "group", groupId)) {
    if (data.role) {
      const currentMembership = await prisma.memberships.findOne({
        where: { id: parseInt(membershipId) },
      });
      if (!currentMembership) throw new Error(MEMBERSHIP_NOT_FOUND);
      if (currentMembership.role === "OWNER" && data.role !== "OWNER") {
        const members = await prisma.memberships.findMany({
          where: { groupId: parseInt(groupId), role: "OWNER" },
        });
        if (members.length === 1) throw new Error(CANNOT_DELETE_SOLE_MEMBER);
      }
    }
    return prisma.memberships.update({
      where: { id: parseInt(membershipId) },
      data,
    });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

/**
 * Delete an group membership for user
 * If an group has only one member, the user,
 * Delete the entire group, not just the membership
 */
export const deleteOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  membershipId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG_MEMBERSHIPS, "group", groupId)) {
    const members = await prisma.memberships.findMany({
      where: { groupId: parseInt(groupId) },
    });
    if (members.length === 1)
      return deleteOrganizationForUser(userId, groupId, locals);
    return prisma.memberships.delete({ where: { id: parseInt(membershipId) } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const inviteMemberToOrganization = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  newMemberName: string,
  newMemberEmail: string,
  role: MembershipRole,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_MEMBERSHIPS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.onlyAllowDomain) {
      const emailDomain = newMemberEmail.split("@")[1];
      try {
        const domainDetails = await getDomainByDomainName(emailDomain);
        if (domainDetails.groupId !== parseInt(groupId)) throw new Error();
      } catch (error) {
        throw new Error(CANNOT_INVITE_DOMAIN);
      }
    }
    let newUser: users | undefined = undefined;
    let userExists = false;
    let createdUserId: number;

    const checkUser = await prisma.users.findMany({
      where: { emails: { some: { email: newMemberEmail } } },
      first: 1,
    });
    if (checkUser.length) {
      newUser = checkUser[0];
      userExists = true;
    }

    if (userExists && newUser) {
      const isMemberAlready =
        (
          await prisma.memberships.findMany({
            where: {
              userId: newUser.id,
              groupId: parseInt(groupId),
            },
          })
        ).length !== 0;
      createdUserId = newUser.id;
      if (isMemberAlready) throw new Error(USER_IS_MEMBER_ALREADY);
      await prisma.memberships.create({
        data: {
          user: { connect: { id: newUser.id } },
          group: { connect: { id: parseInt(groupId) } },
          role,
        },
      });
    } else {
      const newAccount = await register(
        { name: newMemberName },
        locals,
        newMemberEmail,
        groupId,
        role
      );
      createdUserId = newAccount.userId;
    }
    if (createdUserId) {
      const inviter =
        typeof userId !== "object"
          ? (await getUserById(userId))?.name ?? "Someone"
          : "Someone";
      const userDetails = await getUserById(createdUserId);
      mail(newMemberEmail, Templates.INVITED_TO_TEAM, {
        ...userDetails,
        team: group.name,
        inviter,
      })
        .then(() => {})
        .catch(() => {});
    }
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeysForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  queryParams: any
) => {
  if (await can(userId, OrgScopes.READ_ORG_API_KEYS, "group", groupId))
    return paginatedResult(
      await prisma.apiKeys.findMany({
        where: { groupId: parseInt(groupId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  apiKeyId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_API_KEYS, "group", groupId))
    return prisma.apiKeys.findOne({ where: { id: parseInt(apiKeyId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeyLogsForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  apiKeyId: string,
  query: {
    range?: string;
    from?: string;
  }
) => {
  if (await can(userId, OrgScopes.READ_ORG_API_KEY_LOGS, "group", groupId))
    return getApiKeyLogs(apiKeyId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  apiKeyId: string,
  data: apiKeysUpdateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_API_KEYS, "group", groupId)) {
    const result = await prisma.apiKeys.update({
      where: { id: parseInt(apiKeyId) },
      data,
    });
    queueWebhook(groupId, Webhooks.UPDATE_API_KEY, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  apiKey: apiKeysCreateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_API_KEYS, "group", groupId)) {
    apiKey.jwtApiKey = randomString({ length: 20 });
    apiKey.expiresAt = apiKey.expiresAt || new Date(TOKEN_EXPIRY_API_KEY_MAX);
    const result = await prisma.apiKeys.create({
      data: {
        ...apiKey,
        group: {
          connect: {
            id: parseInt(groupId),
          },
        },
      },
    });
    queueWebhook(groupId, Webhooks.CREATE_API_KEY, apiKey);
    trackEvent({ groupId, type: Webhooks.CREATE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  apiKeyId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG_API_KEYS, "group", groupId)) {
    const result = await prisma.apiKeys.delete({
      where: { id: parseInt(apiKeyId) },
    });
    queueWebhook(groupId, Webhooks.DELETE_API_KEY, apiKeyId);
    trackEvent({ groupId, type: Webhooks.DELETE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainsForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  queryParams: any
) => {
  if (await can(userId, OrgScopes.READ_ORG_DOMAINS, "group", groupId))
    return paginatedResult(
      await prisma.domains.findMany({
        where: { groupId: parseInt(groupId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  domainId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_DOMAINS, "group", groupId))
    return prisma.domains.findOne({ where: { id: parseInt(domainId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateDomainForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  domainId: string,
  data: domainsUpdateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_DOMAINS, "group", groupId)) {
    const result = await prisma.domains.update({
      where: { id: parseInt(domainId) },
      data,
    });
    queueWebhook(groupId, Webhooks.UPDATE_DOMAIN, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createDomainForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  domain: domainsCreateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_DOMAINS, "group", groupId)) {
    await checkDomainAvailability(domain.domain);
    const result = await prisma.domains.create({
      data: {
        ...domain,
        verificationCode: await randomString({ length: 25 }),
        isVerified: false,
        group: {
          connect: {
            id: parseInt(groupId),
          },
        },
      },
    });
    queueWebhook(groupId, Webhooks.CREATE_DOMAIN, domain);
    trackEvent({ groupId, type: Webhooks.CREATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteDomainForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  domainId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG_DOMAINS, "group", groupId)) {
    const result = await prisma.domains.delete({
      where: { id: parseInt(domainId) },
    });
    queueWebhook(groupId, Webhooks.DELETE_DOMAIN, domainId);
    trackEvent({ groupId, type: Webhooks.DELETE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const verifyDomainForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  domainId: string,
  method: "dns" | "file",
  locals: Locals
) => {
  if (await can(userId, OrgScopes.VERIFY_ORG_DOMAINS, "group", groupId)) {
    const domain = await prisma.domains.findOne({
      where: { id: parseInt(domainId) },
    });
    if (!domain) throw new Error(RESOURCE_NOT_FOUND);
    if (domain.isVerified) throw new Error(DOMAIN_ALREADY_VERIFIED);
    if (!domain.verificationCode) throw new Error(DOMAIN_UNABLE_TO_VERIFY);
    if (method === "file") {
      try {
        const file: string = (
          await axios.get(
            `http://${domain.domain}/.well-known/${JWT_ISSUER}-verify.txt`
          )
        ).data;
        if (file.replace(/\r?\n|\r/g, "").trim() === domain.verificationCode) {
          const result = await prisma.domains.update({
            where: { id: parseInt(domainId) },
            data: { isVerified: true },
          });
          queueWebhook(groupId, Webhooks.VERIFY_DOMAIN, {
            domainId,
            method,
          });
          trackEvent({ groupId, type: Webhooks.VERIFY_DOMAIN }, locals);
          return result;
        }
      } catch (error) {
        throw new Error(DOMAIN_MISSING_FILE);
      }
    } else {
      const dns = await dnsResolve(domain.domain, "TXT");
      if (JSON.stringify(dns).includes(domain.verificationCode)) {
        const result = await prisma.domains.update({
          where: { id: parseInt(domainId) },
          data: { isVerified: true },
        });
        queueWebhook(groupId, Webhooks.VERIFY_DOMAIN, {
          domainId,
          method,
        });
        trackEvent({ groupId, type: Webhooks.VERIFY_DOMAIN }, locals);
        return result;
      } else {
        throw new Error(DOMAIN_MISSING_DNS);
      }
    }
    throw new Error(DOMAIN_UNABLE_TO_VERIFY);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationWebhooksForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  queryParams: any
) => {
  if (await can(userId, OrgScopes.READ_ORG_WEBHOOKS, "group", groupId))
    return paginatedResult(
      await prisma.webhooks.findMany({
        where: { groupId: parseInt(groupId) },
        ...queryParamsToSelect(queryParams),
      }),
      { first: queryParams.first, last: queryParams.last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationWebhookForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  webhookId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_WEBHOOKS, "group", groupId))
    return prisma.webhooks.findOne({ where: { id: parseInt(webhookId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateWebhookForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  webhookId: string,
  data: webhooksUpdateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG_WEBHOOKS, "group", groupId)) {
    const result = await prisma.webhooks.update({
      where: { id: parseInt(webhookId) },
      data,
    });
    queueWebhook(groupId, Webhooks.UPDATE_WEBHOOK, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createWebhookForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  webhook: webhooksCreateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG_WEBHOOKS, "group", groupId)) {
    const result = await prisma.webhooks.create({
      data: {
        ...webhook,
        group: {
          connect: {
            id: parseInt(groupId),
          },
        },
      },
    });
    fireSingleWebhook(result, Webhooks.TEST_WEBHOOK)
      .then(() => {})
      .catch(() => {});
    queueWebhook(groupId, Webhooks.CREATE_WEBHOOK, webhook);
    trackEvent({ groupId, type: Webhooks.CREATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteWebhookForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  webhookId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_WEBHOOKS, "group", groupId)) {
    const result = prisma.webhooks.delete({
      where: { id: parseInt(webhookId) },
    });
    queueWebhook(groupId, Webhooks.DELETE_WEBHOOK, webhookId);
    trackEvent({ groupId, type: Webhooks.DELETE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const applyCouponToOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  coupon: string
) => {
  if (await can(userId, OrgScopes.CREATE_ORG_TRANSACTIONS, "group", groupId)) {
    let amount: number | undefined = undefined;
    let currency: string | undefined = undefined;
    let description: string | undefined = undefined;
    try {
      const result = await verifyToken<{
        amount: number;
        currency: string;
        description?: string;
      }>(coupon, Tokens.COUPON);
      await checkInvalidatedToken(coupon);
      amount = result.amount;
      currency = result.currency;
      description = result.description;
    } catch (error) {
      throw new Error(INVALID_INPUT);
    }
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (amount && currency && group.stripeCustomerId) {
      const result = await createCustomerBalanceTransaction(
        group.stripeCustomerId,
        {
          amount,
          currency,
          description,
        }
      );
      await invalidateToken(coupon);
      return result;
    }
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationTransactionsForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  params: KeyValue
) => {
  if (await can(userId, OrgScopes.READ_ORG_TRANSACTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getCustomBalanceTransactions(group.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationTransactionForUser = async (
  userId: string | ApiKeyResponse,
  groupId: string,
  transactionId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG_TRANSACTIONS, "group", groupId)) {
    const group = await getOrganizationById(groupId);
    if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
    if (group.stripeCustomerId)
      return getCustomBalanceTransaction(group.stripeCustomerId, transactionId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
