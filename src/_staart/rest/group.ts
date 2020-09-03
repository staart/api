import {
  apiKeysCreateInput,
  apiKeysUpdateInput,
  domainsCreateInput,
  domainsUpdateInput,
  groupsCreateInput,
  groupsUpdateInput,
  MembershipRole,
  membershipsUpdateInput,
  users,
  webhooksCreateInput,
  webhooksUpdateInput,
} from "@prisma/client";
import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_INVITE_DOMAIN,
  DOMAIN_ALREADY_VERIFIED,
  DOMAIN_MISSING_DNS,
  DOMAIN_MISSING_FILE,
  DOMAIN_UNABLE_TO_VERIFY,
  INSUFFICIENT_PERMISSION,
  INVALID_INPUT,
  MEMBERSHIP_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  RESOURCE_NOT_FOUND,
  STRIPE_NO_CUSTOMER,
  USER_IS_MEMBER_ALREADY,
} from "@staart/errors";
import {
  createCustomer,
  createCustomerBalanceTransaction,
  createSource,
  createSubscription,
  deleteCustomer,
  deleteSource,
  getCustomBalanceTransaction,
  getCustomBalanceTransactions,
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
} from "@staart/payments";
import { randomString } from "@staart/text";
import axios from "axios";
import { JWT_ISSUER, ScopesGroup, ScopesUser } from "../../config";
import { can, Acts } from "../helpers/authorization";
import { deleteItemFromCache } from "../helpers/cache";
import {
  ApiKeyResponse,
  checkInvalidatedToken,
  invalidateToken,
  verifyToken,
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import {
  paginatedResult,
  prisma,
  queryParamsToSelect,
} from "../helpers/prisma";
import { trackEvent } from "../helpers/tracking";
import { dnsResolve } from "../helpers/utils";
import { fireSingleWebhook, queueWebhook } from "../helpers/webhooks";
import { OrgScopes, Templates, Tokens, Webhooks } from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import {
  checkDomainAvailability,
  createGroup,
  getApiKeyLogs,
  getDomainByDomainName,
  getGroupById,
} from "../services/group.service";
import { getUserById } from "../services/user.service";
import { register } from "./auth";

export const getGroupForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number
) => {
  if (
    !(await can(userId, `${Acts.WRITE}${ScopesGroup.INFO}`, `group-${groupId}`))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return getGroupById(groupId);
};

export const newGroupForUser = async (
  userId: number,
  group: groupsCreateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesUser.MEMBERSHIPS}`,
      `user-${userId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  if (!(group.name || "").trim()) {
    const user = await getUserById(userId);
    group.name = user.name;
  }
  return createGroup(group, userId);
};

export const updateGroupForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  data: groupsUpdateInput,
  locals: Locals | any
) => {
  if (
    !(await can(userId, `${Acts.WRITE}${ScopesGroup.INFO}`, `group-${groupId}`))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.groups.update({
    where: {
      id: groupId,
    },
    data,
  });
  queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION, data);
  trackEvent({ groupId, type: Webhooks.UPDATE_ORGANIZATION }, locals);
  return result;
};

export const deleteGroupForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  locals: Locals | any
) => {
  if (!(await can(userId, Acts.DELETE, `group-${groupId}`)))
    throw new Error(INSUFFICIENT_PERMISSION);

  const groupDetails = await getGroupById(groupId);
  await deleteItemFromCache(`cache_getGroupById_${groupDetails.id}`);
  if (
    typeof groupDetails.attributes === "object" &&
    !Array.isArray(groupDetails.attributes) &&
    groupDetails.attributes?.stripeCustomerId === "string"
  )
    await deleteCustomer(groupDetails.attributes?.stripeCustomerId);
  await prisma.groups.delete({
    where: {
      id: groupId,
    },
  });
  queueWebhook(groupId, Webhooks.DELETE_ORGANIZATION);
  trackEvent({ groupId, type: Webhooks.DELETE_ORGANIZATION }, locals);
  return;
};

export const getGroupBillingForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.BILLING}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getCustomer(group.attributes?.stripeCustomerId);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const updateGroupBillingForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  data: any,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.BILLING}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  let result;
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    result = await updateCustomer(group.attributes?.stripeCustomerId, data);
  } else {
    result = await createCustomer(
      groupId,
      data,
      (groupId: number, data: groupsUpdateInput) =>
        prisma.groups.update({ where: { id: groupId }, data })
    );
  }
  queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION_BILLING, data);
  trackEvent({ groupId, type: Webhooks.UPDATE_ORGANIZATION_BILLING }, locals);
  return result;
};

export const getGroupInvoicesForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  params: KeyValue
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.INVOICES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getInvoices(group.attributes?.stripeCustomerId, params);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupInvoiceForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  invoiceId: string
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.INVOICES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getInvoice(group.attributes?.stripeCustomerId, invoiceId);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupSourcesForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  params: KeyValue
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.SOURCES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getSources(group.attributes?.stripeCustomerId, params);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupSourceForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  sourceId: string
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.SOURCES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getSource(group.attributes?.stripeCustomerId, sourceId);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupSubscriptionsForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  params: KeyValue
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.SUBSCRIPTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getSubscriptions(group.attributes?.stripeCustomerId, params);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupSubscriptionForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  subscriptionId: string
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.SUBSCRIPTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getSubscription(group.attributes?.stripeCustomerId, subscriptionId);
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const updateGroupSubscriptionForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  subscriptionId: string,
  data: KeyValue,
  locals?: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.SUBSCRIPTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await updateSubscription(
      group.attributes?.stripeCustomerId,
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
};

export const createGroupSubscriptionForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  params: { plan: string; [index: string]: any },
  locals?: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.SUBSCRIPTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await createSubscription(
      group.attributes?.stripeCustomerId,
      params
    );
    queueWebhook(groupId, Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION, params);
    trackEvent(
      { groupId, type: Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION },
      locals
    );
    return result;
  }
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupPricingPlansForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.BILLING}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return getProductPricing();
};

export const deleteGroupSourceForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  sourceId: string,
  locals?: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.SOURCES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await deleteSource(
      group.attributes?.stripeCustomerId,
      sourceId
    );
    queueWebhook(groupId, Webhooks.DELETE_ORGANIZATION_SOURCE, sourceId);
    trackEvent({ groupId, type: Webhooks.DELETE_ORGANIZATION_SOURCE }, locals);
    return result;
  }
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const updateGroupSourceForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  sourceId: string,
  data: any,
  locals?: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.SOURCES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await updateSource(
      group.attributes?.stripeCustomerId,
      sourceId,
      data
    );
    queueWebhook(groupId, Webhooks.UPDATE_ORGANIZATION_SOURCE, data);
    trackEvent({ groupId, type: Webhooks.UPDATE_ORGANIZATION_SOURCE }, locals);
    return result;
  }
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const createGroupSourceForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  card: any,
  locals?: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.SOURCES}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await createSource(group.attributes?.stripeCustomerId, card);
    queueWebhook(groupId, Webhooks.CREATE_ORGANIZATION_SOURCE, card);
    trackEvent({ groupId, type: Webhooks.CREATE_ORGANIZATION_SOURCE }, locals);
    return result;
  }
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getAllGroupDataForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.SECURITY}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await prisma.groups.findOne({
    where: {
      id: groupId,
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
    ...(typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    typeof group.attributes?.stripeCustomerId === "string"
      ? {
          billing: await getCustomer(group.attributes?.stripeCustomerId),
          subscriptions: await getSubscriptions(
            group.attributes?.stripeCustomerId,
            {}
          ),
          invoices: await getInvoices(group.attributes?.stripeCustomerId, {}),
          sources: await getSources(group.attributes?.stripeCustomerId, {}),
        }
      : {}),
  };
};

export const getGroupMembershipsForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  queryParams: any
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.MEMBERSHIPS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.memberships.findMany({
      where: { groupId: groupId },
      ...queryParamsToSelect(queryParams),
    }),
    { take: queryParams.take }
  );
};

export const getGroupMembershipForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  membershipId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.MEMBERSHIPS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.memberships.findOne({
    where: { id: membershipId },
    include: { user: true },
  });
};

export const updateGroupMembershipForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  membershipId: number,
  data: membershipsUpdateInput
) => {
  if (!(await can(userId, Acts.WRITE, `membership-${membershipId}`)))
    throw new Error(INSUFFICIENT_PERMISSION);

  if (data.role) {
    const currentMembership = await prisma.memberships.findOne({
      where: { id: membershipId },
    });
    if (!currentMembership) throw new Error(MEMBERSHIP_NOT_FOUND);
    if (currentMembership.role === "OWNER" && data.role !== "OWNER") {
      const members = await prisma.memberships.findMany({
        where: { groupId: groupId, role: "OWNER" },
      });
      if (members.length === 1) throw new Error(CANNOT_DELETE_SOLE_MEMBER);
    }
  }
  return prisma.memberships.update({
    where: { id: membershipId },
    data,
  });
};

/**
 * Delete an group membership for user
 * If an group has only one member, the user,
 * Delete the entire group, not just the membership
 */
export const deleteGroupMembershipForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  membershipId: number,
  locals: Locals | any
) => {
  if (!(await can(userId, Acts.DELETE, `membership-${membershipId}`)))
    throw new Error(INSUFFICIENT_PERMISSION);

  const members = await prisma.memberships.findMany({
    where: { groupId: groupId },
  });
  if (members.length === 1) return deleteGroupForUser(userId, groupId, locals);
  return prisma.memberships.delete({ where: { id: membershipId } });
};

export const inviteMemberToGroup = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  newMemberName: string,
  newMemberEmail: string,
  role: MembershipRole,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.MEMBERSHIPS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);

  /**
   * Only users with emails on verified domain can join this group
   * Make sure that the provided email ends with the domain
   */
  if (group.onlyAllowDomain) {
    const emailDomain = newMemberEmail.split("@")[1];
    try {
      const domainDetails = await getDomainByDomainName(emailDomain);
      if (domainDetails.groupId !== groupId) throw new Error();
    } catch (error) {
      throw new Error(CANNOT_INVITE_DOMAIN);
    }
  }
  let newUser: users | undefined = undefined;
  let userExists = false;
  let createdUserId: number;

  /**
   * Check if a user with the email already exists
   */
  const checkUser = await prisma.users.findMany({
    where: { emails: { some: { email: newMemberEmail, isVerified: true } } },
    take: 1,
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
            groupId: groupId,
          },
        })
      ).length !== 0;
    createdUserId = newUser.id;
    if (isMemberAlready) throw new Error(USER_IS_MEMBER_ALREADY);

    await prisma.memberships.create({
      data: {
        user: { connect: { id: newUser.id } },
        group: { connect: { id: groupId } },
        role,
      },
    });
  } else {
    const newAccount = await register(
      {
        name: newMemberName,
      },
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
    mail({
      to: newMemberEmail,
      template: Templates.INVITED_TO_TEAM,
      data: {
        ...userDetails,
        team: group.name,
        inviter,
      },
    })
      .then(() => {})
      .catch(() => {});
  }
  return;
};

export const getGroupApiKeysForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  queryParams: any
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.apiKeys.findMany({
      where: { groupId: groupId },
      ...queryParamsToSelect(queryParams),
    }),
    { take: queryParams.take }
  );
};

export const getGroupApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  apiKeyId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.apiKeys.findOne({ where: { id: apiKeyId } });
};

export const getGroupApiKeyLogsForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  apiKeyId: number,
  query: {
    range?: string;
    from?: string;
  }
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.API_KEY_LOGS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return getApiKeyLogs(apiKeyId, query);
};

export const updateApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  apiKeyId: number,
  data: apiKeysUpdateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.apiKeys.update({
    where: { id: apiKeyId },
    data,
  });
  queueWebhook(groupId, Webhooks.UPDATE_API_KEY, data);
  trackEvent({ groupId, type: Webhooks.UPDATE_API_KEY }, locals);
  return result;
};

export const createApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  apiKey: apiKeysCreateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  apiKey.apiKey = randomString({ length: 32 });
  const result = await prisma.apiKeys.create({
    data: {
      ...apiKey,
      group: {
        connect: {
          id: groupId,
        },
      },
    },
  });
  queueWebhook(groupId, Webhooks.CREATE_API_KEY, apiKey);
  trackEvent({ groupId, type: Webhooks.CREATE_API_KEY }, locals);
  return result;
};

export const deleteApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  apiKeyId: number,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.apiKeys.delete({
    where: { id: apiKeyId },
  });
  queueWebhook(groupId, Webhooks.DELETE_API_KEY, apiKeyId);
  trackEvent({ groupId, type: Webhooks.DELETE_API_KEY }, locals);
  return result;
};

export const getGroupDomainsForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  queryParams: any
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.domains.findMany({
      where: { groupId: groupId },
      ...queryParamsToSelect(queryParams),
    }),
    { take: queryParams.take }
  );
};

export const getGroupDomainForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  domainId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.domains.findOne({ where: { id: domainId } });
};

export const updateDomainForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  domainId: number,
  data: domainsUpdateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.domains.update({
    where: { id: domainId },
    data,
  });
  queueWebhook(groupId, Webhooks.UPDATE_DOMAIN, data);
  trackEvent({ groupId, type: Webhooks.UPDATE_DOMAIN }, locals);
  return result;
};

export const createDomainForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  domain: domainsCreateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  await checkDomainAvailability(domain.domain);
  const result = await prisma.domains.create({
    data: {
      ...domain,
      verificationCode: await randomString({ length: 25 }),
      isVerified: false,
      group: {
        connect: {
          id: groupId,
        },
      },
    },
  });
  queueWebhook(groupId, Webhooks.CREATE_DOMAIN, domain);
  trackEvent({ groupId, type: Webhooks.CREATE_DOMAIN }, locals);
  return result;
};

export const deleteDomainForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  domainId: number,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.domains.delete({
    where: { id: domainId },
  });
  queueWebhook(groupId, Webhooks.DELETE_DOMAIN, domainId);
  trackEvent({ groupId, type: Webhooks.DELETE_DOMAIN }, locals);
  return result;
};

export const verifyDomainForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  domainId: number,
  method: "dns" | "file",
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.DOMAINS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const domain = await prisma.domains.findOne({
    where: { id: domainId },
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
          where: { id: domainId },
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
        where: { id: domainId },
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
};

export const getGroupWebhooksForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  queryParams: any
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.WEBHOOKS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return paginatedResult(
    await prisma.webhooks.findMany({
      where: { groupId: groupId },
      ...queryParamsToSelect(queryParams),
    }),
    { take: queryParams.take }
  );
};

export const getGroupWebhookForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  webhookId: number
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.WEBHOOKS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  return prisma.webhooks.findOne({ where: { id: webhookId } });
};

export const updateWebhookForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  webhookId: number,
  data: webhooksUpdateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.WEBHOOKS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.webhooks.update({
    where: { id: webhookId },
    data,
  });
  queueWebhook(groupId, Webhooks.UPDATE_WEBHOOK, data);
  trackEvent({ groupId, type: Webhooks.UPDATE_WEBHOOK }, locals);
  return result;
};

export const createWebhookForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  webhook: webhooksCreateInput,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.WEBHOOKS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = await prisma.webhooks.create({
    data: {
      ...webhook,
      group: {
        connect: {
          id: groupId,
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
};

export const deleteWebhookForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  webhookId: number,
  locals: Locals | any
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.WEBHOOKS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const result = prisma.webhooks.delete({
    where: { id: webhookId },
  });
  queueWebhook(groupId, Webhooks.DELETE_WEBHOOK, webhookId);
  trackEvent({ groupId, type: Webhooks.DELETE_WEBHOOK }, locals);
  return result;
};

export const applyCouponToGroupForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  coupon: string
) => {
  if (
    !(await can(
      userId,
      `${Acts.WRITE}${ScopesGroup.TRANSACTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

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
  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    amount &&
    currency &&
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  ) {
    const result = await createCustomerBalanceTransaction(
      group.attributes?.stripeCustomerId,
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
};

export const getGroupTransactionsForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  params: KeyValue
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.TRANSACTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getCustomBalanceTransactions(
      group.attributes?.stripeCustomerId,
      params
    );
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupTransactionForUser = async (
  userId: number | ApiKeyResponse,
  groupId: number,
  transactionId: string
) => {
  if (
    !(await can(
      userId,
      `${Acts.READ}${ScopesGroup.TRANSACTIONS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const group = await getGroupById(groupId);
  if (!group) throw new Error(ORGANIZATION_NOT_FOUND);
  if (
    typeof group.attributes === "object" &&
    !Array.isArray(group.attributes) &&
    group.attributes?.stripeCustomerId === "string"
  )
    return getCustomBalanceTransaction(
      group.attributes?.stripeCustomerId,
      transactionId
    );
  throw new Error(STRIPE_NO_CUSTOMER);
};

export const getGroupApiKeyScopesForUser = async (
  tokenUserId: number | ApiKeyResponse,
  groupId: number
) => {
  if (
    !(await can(
      tokenUserId,
      `${Acts.READ}${ScopesGroup.API_KEYS}`,
      `group-${groupId}`
    ))
  )
    throw new Error(INSUFFICIENT_PERMISSION);

  const data: { [index: string]: any } = {};
  Object.values(ScopesGroup).forEach((scope) => {
    data[scope] = [];
    [Acts.READ, Acts.WRITE].forEach((act) => {
      data[scope].push({
        value: `p, user-${tokenUserId}, group-${groupId}, ${act}${scope}`,
        name: `${act}${scope}`,
      });
    });
  });
  const memberships = await prisma.memberships.findMany({
    where: { groupId },
  });
  data["delete:data"] = [
    {
      name: `${Acts.DELETE}group`,
      value: `p, user-${tokenUserId}, group-${groupId}, ${Acts.DELETE}${ScopesGroup.INFO}`,
    },
    ...memberships.map((membership) => ({
      value: `p, user-${tokenUserId}, membership-${membership.id}, ${Acts.DELETE}${ScopesUser.MEMBERSHIPS}`,
      name: `${Acts.DELETE}membership-${membership.id}`,
    })),
  ];

  return data;
};
