import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_INVITE_DOMAIN,
  DOMAIN_ALREADY_VERIFIED,
  INVALID_INPUT,
  DOMAIN_MISSING_DNS,
  DOMAIN_MISSING_FILE,
  DOMAIN_UNABLE_TO_VERIFY,
  INSUFFICIENT_PERMISSION,
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
import { JWT_ISSUER } from "../config";
import { can } from "../helpers/authorization";
import {
  ApiKeyResponse,
  verifyToken,
  checkInvalidatedToken,
  invalidateToken,
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { trackEvent } from "../helpers/tracking";
import { dnsResolve, organizationUsernameToId } from "../helpers/utils";
import { queueWebhook } from "../helpers/webhooks";
import { OrgScopes, Templates, Webhooks, Tokens } from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { register } from "./auth";
import { prisma, paginatedResult } from "../helpers/prisma";
import {
  organizationsCreateInput,
  organizationsUpdateInput,
  membershipsInclude,
  membershipsSelect,
  membershipsOrderByInput,
  membershipsWhereUniqueInput,
  membershipsUpdateInput,
  users,
  MembershipRole,
  api_keysSelect,
  api_keysInclude,
  api_keysOrderByInput,
  api_keysWhereUniqueInput,
  api_keysUpdateInput,
  api_keysCreateInput,
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
} from "../services/organization.service";
import { fireSingleWebhook } from "../helpers/webhooks";
import { getUserById } from "../services/user.service";
import { deleteItemFromCache } from "../helpers/cache";

export const getOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG, "organization", organizationId))
    return getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: string,
  organization: organizationsCreateInput,
  locals: Locals
) => {
  if (!organization.name) {
    const user = await getUserById(userId);
    organization.name = user.name;
  }
  return createOrganization(organization, userId);
};

export const updateOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  data: organizationsUpdateInput,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG, "organization", organizationId)) {
    const result = await prisma.organizations.update({
      where: {
        id: parseInt(
          typeof userId === "object" ? userId.organizationId : userId
        ),
      },
      data,
    });
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_ORGANIZATION }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG, "organization", organizationId)) {
    const organizationDetails = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    await deleteItemFromCache(
      `cache_getOrganizationById_${organizationDetails.id}`,
      `cache_getOrganizationByUsername_${organizationDetails.username}`
    );
    if (organizationDetails.stripeCustomerId)
      await deleteCustomer(organizationDetails.stripeCustomerId);
    await prisma.organizations.delete({
      where: {
        id: parseInt(
          typeof userId === "object" ? userId.organizationId : userId
        ),
      },
    });
    queueWebhook(organizationId, Webhooks.DELETE_ORGANIZATION);
    trackEvent({ organizationId, type: Webhooks.DELETE_ORGANIZATION }, locals);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationBillingForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_BILLING,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getCustomer(organization.stripeCustomerId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationBillingForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  data: any,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_BILLING,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    let result;
    if (organization.stripeCustomerId) {
      result = await updateCustomer(organization.stripeCustomerId, data);
    } else {
      result = await createCustomer(
        organizationId,
        data,
        (organizationId: string, data: organizationsUpdateInput) =>
          prisma.organizations.update({
            where: {
              id: parseInt(
                typeof userId === "object" ? userId.organizationId : userId
              ),
            },
            data,
          })
      );
    }
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION_BILLING, data);
    trackEvent(
      { organizationId, type: Webhooks.UPDATE_ORGANIZATION_BILLING },
      locals
    );
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoicesForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  params: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_INVOICES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getInvoices(organization.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoiceForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  invoiceId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_INVOICES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getInvoice(organization.stripeCustomerId, invoiceId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourcesForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  params: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_SOURCES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getSources(organization.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  sourceId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_SOURCES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getSource(organization.stripeCustomerId, sourceId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSubscriptionsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  params: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_SUBSCRIPTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getSubscriptions(organization.stripeCustomerId, params);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationSubscriptionForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  subscriptionId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_SUBSCRIPTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getSubscription(organization.stripeCustomerId, subscriptionId);
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationSubscriptionForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  subscriptionId: string,
  data: KeyValue,
  locals?: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_SUBSCRIPTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId) {
      const result = await updateSubscription(
        organization.stripeCustomerId,
        subscriptionId,
        data
      );
      queueWebhook(
        organizationId,
        Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION,
        data
      );
      trackEvent(
        { organizationId, type: Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION },
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
  organizationId: string,
  params: { plan: string; [index: string]: any },
  locals?: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_SUBSCRIPTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId) {
      const result = await createSubscription(
        organization.stripeCustomerId,
        params
      );
      queueWebhook(
        organizationId,
        Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION,
        params
      );
      trackEvent(
        { organizationId, type: Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION },
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
  organizationId: string
) => {
  if (
    await can(userId, OrgScopes.READ_ORG_PLANS, "organization", organizationId)
  )
    return getProductPricing();
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationSourceForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  sourceId: string,
  locals?: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.DELETE_ORG_SOURCES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId) {
      const result = await deleteSource(
        organization.stripeCustomerId,
        sourceId
      );
      queueWebhook(
        organizationId,
        Webhooks.DELETE_ORGANIZATION_SOURCE,
        sourceId
      );
      trackEvent(
        { organizationId, type: Webhooks.DELETE_ORGANIZATION_SOURCE },
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
  organizationId: string,
  sourceId: string,
  data: any,
  locals?: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_SOURCES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId) {
      const result = await updateSource(
        organization.stripeCustomerId,
        sourceId,
        data
      );
      queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION_SOURCE, data);
      trackEvent(
        { organizationId, type: Webhooks.UPDATE_ORGANIZATION_SOURCE },
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
  organizationId: string,
  card: any,
  locals?: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_SOURCES,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId) {
      const result = await createSource(organization.stripeCustomerId, card);
      queueWebhook(organizationId, Webhooks.CREATE_ORGANIZATION_SOURCE, card);
      trackEvent(
        { organizationId, type: Webhooks.CREATE_ORGANIZATION_SOURCE },
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
  organizationId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_TRANSACTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await prisma.organizations.findOne({
      where: {
        id: parseInt(
          typeof userId === "object" ? userId.organizationId : userId
        ),
      },
      include: {
        api_keys: true,
        domains: true,
        memberships: true,
        webhooks: true,
      },
    });
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    return {
      organization,
      ...(organization.stripeCustomerId
        ? {
            billing: await getCustomer(organization.stripeCustomerId),
            subscriptions: await getSubscriptions(
              organization.stripeCustomerId,
              {}
            ),
            invoices: await getInvoices(organization.stripeCustomerId, {}),
            sources: await getSources(organization.stripeCustomerId, {}),
          }
        : {}),
    };
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: membershipsSelect;
    include?: membershipsInclude;
    orderBy?: membershipsOrderByInput;
    skip?: number;
    after?: membershipsWhereUniqueInput;
    before?: membershipsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  )
    return paginatedResult(
      await prisma.memberships.findMany({
        where: { organizationId: parseInt(organizationId) },
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  membershipId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  )
    return prisma.memberships.findOne({
      where: { id: parseInt(membershipId) },
      include: { user: true },
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  membershipId: string,
  data: membershipsUpdateInput
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  )
    return prisma.memberships.update({
      where: { id: parseInt(membershipId) },
      data,
    });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  membershipId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.DELETE_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  ) {
    const members = await prisma.memberships.findMany({
      where: { organizationId: parseInt(organizationId) },
    });
    if (members.length === 1) throw new Error(CANNOT_DELETE_SOLE_MEMBER);
    return prisma.memberships.delete({ where: { id: parseInt(membershipId) } });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const inviteMemberToOrganization = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  newMemberName: string,
  newMemberEmail: string,
  role: MembershipRole,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.onlyAllowDomain) {
      const emailDomain = newMemberEmail.split("@")[1];
      try {
        const domainDetails = await getDomainByDomainName(emailDomain);
        if (domainDetails.organizationId !== parseInt(organizationId))
          throw new Error();
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
              organizationId: parseInt(organizationId),
            },
          })
        ).length !== 0;
      createdUserId = newUser.id;
      if (isMemberAlready) throw new Error(USER_IS_MEMBER_ALREADY);
      await prisma.memberships.create({
        data: {
          user: { connect: { id: newUser.id } },
          organization: { connect: { id: parseInt(organizationId) } },
          role,
        },
      });
    } else {
      const newAccount = await register(
        { name: newMemberName },
        locals,
        newMemberEmail,
        organizationId,
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
        team: organization.name,
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
  organizationId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: api_keysSelect;
    include?: api_keysInclude;
    orderBy?: api_keysOrderByInput;
    skip?: number;
    after?: api_keysWhereUniqueInput;
    before?: api_keysWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_API_KEYS,
      "organization",
      organizationId
    )
  )
    return paginatedResult(
      await prisma.api_keys.findMany({
        where: { organizationId: parseInt(organizationId) },
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_API_KEYS,
      "organization",
      organizationId
    )
  )
    return prisma.api_keys.findOne({ where: { id: parseInt(apiKeyId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeyLogsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string,
  query: {
    range?: string;
    from?: string;
  }
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_API_KEY_LOGS,
      "organization",
      organizationId
    )
  )
    return getApiKeyLogs(apiKeyId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string,
  data: api_keysUpdateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_API_KEYS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.api_keys.update({
      where: { id: parseInt(apiKeyId) },
      data,
    });
    queueWebhook(organizationId, Webhooks.UPDATE_API_KEY, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKey: api_keysCreateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_API_KEYS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.api_keys.create({
      data: {
        ...apiKey,
        organization: {
          connect: {
            id: parseInt(
              typeof userId === "object" ? userId.organizationId : userId
            ),
          },
        },
      },
    });
    queueWebhook(organizationId, Webhooks.CREATE_API_KEY, apiKey);
    trackEvent({ organizationId, type: Webhooks.CREATE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.DELETE_ORG_API_KEYS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.api_keys.delete({
      where: { id: parseInt(apiKeyId) },
    });
    queueWebhook(organizationId, Webhooks.DELETE_API_KEY, apiKeyId);
    trackEvent({ organizationId, type: Webhooks.DELETE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: domainsSelect;
    include?: domainsInclude;
    orderBy?: domainsOrderByInput;
    skip?: number;
    after?: domainsWhereUniqueInput;
    before?: domainsWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_DOMAINS,
      "organization",
      organizationId
    )
  )
    return paginatedResult(
      await prisma.domains.findMany({
        where: { organizationId: parseInt(organizationId) },
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domainId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_DOMAINS,
      "organization",
      organizationId
    )
  )
    return prisma.domains.findOne({ where: { id: parseInt(domainId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domainId: string,
  data: domainsUpdateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_DOMAINS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.domains.update({
      where: { id: parseInt(domainId) },
      data,
    });
    queueWebhook(organizationId, Webhooks.UPDATE_DOMAIN, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domain: domainsCreateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_DOMAINS,
      "organization",
      organizationId
    )
  ) {
    await checkDomainAvailability(domain.domain);
    const result = await prisma.domains.create({
      data: {
        ...domain,
        isVerified: false,
        organization: {
          connect: {
            id: parseInt(
              typeof userId === "object" ? userId.organizationId : userId
            ),
          },
        },
      },
    });
    queueWebhook(organizationId, Webhooks.CREATE_DOMAIN, domain);
    trackEvent({ organizationId, type: Webhooks.CREATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domainId: string,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.DELETE_ORG_DOMAINS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.domains.delete({
      where: { id: parseInt(domainId) },
    });
    queueWebhook(organizationId, Webhooks.DELETE_DOMAIN, domainId);
    trackEvent({ organizationId, type: Webhooks.DELETE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const verifyDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domainId: string,
  method: "dns" | "file",
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.VERIFY_ORG_DOMAINS,
      "organization",
      organizationId
    )
  ) {
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
          queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN, {
            domainId,
            method,
          });
          trackEvent({ organizationId, type: Webhooks.VERIFY_DOMAIN }, locals);
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
        queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN, {
          domainId,
          method,
        });
        trackEvent({ organizationId, type: Webhooks.VERIFY_DOMAIN }, locals);
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
  organizationId: string,
  {
    select,
    include,
    orderBy,
    skip,
    after,
    before,
    first,
    last,
  }: {
    select?: webhooksSelect;
    include?: webhooksInclude;
    orderBy?: webhooksOrderByInput;
    skip?: number;
    after?: webhooksWhereUniqueInput;
    before?: webhooksWhereUniqueInput;
    first?: number;
    last?: number;
  }
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  )
    return paginatedResult(
      await prisma.webhooks.findMany({
        where: { organizationId: parseInt(organizationId) },
        select,
        include,
        orderBy,
        skip,
        after,
        before,
        first,
        last,
      }),
      { first, last }
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhookId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  )
    return prisma.webhooks.findOne({ where: { id: parseInt(webhookId) } });
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhookId: string,
  data: webhooksUpdateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.webhooks.update({
      where: { id: parseInt(webhookId) },
      data,
    });
    queueWebhook(organizationId, Webhooks.UPDATE_WEBHOOK, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhook: webhooksCreateInput,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.DELETE_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  ) {
    const result = await prisma.webhooks.create({
      data: {
        ...webhook,
        organization: {
          connect: {
            id: parseInt(
              typeof userId === "object" ? userId.organizationId : userId
            ),
          },
        },
      },
    });
    fireSingleWebhook(result, Webhooks.TEST_WEBHOOK)
      .then(() => {})
      .catch(() => {});
    queueWebhook(organizationId, Webhooks.CREATE_WEBHOOK, webhook);
    trackEvent({ organizationId, type: Webhooks.CREATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhookId: string,
  locals: Locals
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  ) {
    const result = prisma.webhooks.delete({
      where: { id: parseInt(webhookId) },
    });
    queueWebhook(organizationId, Webhooks.DELETE_WEBHOOK, webhookId);
    trackEvent({ organizationId, type: Webhooks.DELETE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const applyCouponToOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  coupon: string
) => {
  if (
    await can(
      userId,
      OrgScopes.CREATE_ORG_TRANSACTIONS,
      "organization",
      organizationId
    )
  ) {
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
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (amount && currency && organization.stripeCustomerId) {
      const result = await createCustomerBalanceTransaction(
        organization.stripeCustomerId,
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
  organizationId: string,
  params: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_TRANSACTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getCustomBalanceTransactions(
        organization.stripeCustomerId,
        params
      );
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationTransactionForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  transactionId: string
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_TRANSACTIONS,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganizationById(
      typeof userId === "object" ? userId.organizationId : userId
    );
    if (!organization) throw new Error(ORGANIZATION_NOT_FOUND);
    if (organization.stripeCustomerId)
      return getCustomBalanceTransaction(
        organization.stripeCustomerId,
        transactionId
      );
    throw new Error(STRIPE_NO_CUSTOMER);
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
