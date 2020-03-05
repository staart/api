import {
  CANNOT_DELETE_SOLE_MEMBER,
  CANNOT_INVITE_DOMAIN,
  DOMAIN_ALREADY_VERIFIED,
  DOMAIN_MISSING_DNS,
  DOMAIN_MISSING_FILE,
  DOMAIN_UNABLE_TO_VERIFY,
  INSUFFICIENT_PERMISSION,
  STRIPE_NO_CUSTOMER,
  USER_IS_MEMBER_ALREADY,
  USER_NOT_FOUND
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
  createCustomerBalanceTransaction
} from "@staart/payments";
import axios from "axios";
import { JWT_ISSUER } from "../config";
import {
  createMembership,
  getUserOrganizationMembership
} from "../crud/membership";
import {
  checkDomainAvailability,
  createApiKey,
  createDomain,
  createOrganization,
  createWebhook,
  deleteAllOrganizationMemberships,
  deleteApiKey,
  deleteDomain,
  deleteOrganization,
  deleteOrganizationMembership,
  deleteWebhook,
  getApiKey,
  getApiKeyLogs,
  getDomain,
  getDomainByDomainName,
  getOrganization,
  getOrganizationApiKeys,
  getOrganizationDomains,
  getOrganizationMembershipDetailed,
  getOrganizationMemberships,
  getOrganizationWebhooks,
  getWebhook,
  updateApiKey,
  updateDomain,
  updateOrganization,
  updateOrganizationMembership,
  updateWebhook
} from "../crud/organization";
import { getUser, getUserByEmail } from "../crud/user";
import { can } from "../helpers/authorization";
import { ApiKeyResponse, verifyToken, couponCodeJwt } from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { trackEvent } from "../helpers/tracking";
import { dnsResolve } from "../helpers/utils";
import { queueWebhook } from "../helpers/webhooks";
import {
  Authorizations,
  MembershipRole,
  OrgScopes,
  Templates,
  Webhooks,
  Tokens
} from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { InsertResult } from "../interfaces/mysql";
import { Organization, Webhook } from "../interfaces/tables/organization";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";

export const getOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG, "organization", organizationId))
    return getOrganization(organizationId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: string,
  organization: Organization,
  locals: Locals
) => {
  if (!organization.name) {
    const user = await getUser(userId);
    organization.name = user.name;
  }
  const org = (await createOrganization(organization)) as InsertResult;
  const organizationId = org.insertId;
  await createMembership({
    organizationId,
    userId,
    role: MembershipRole.OWNER
  });
  return;
};

export const updateOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  data: Organization,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG, "organization", organizationId)) {
    await updateOrganization(organizationId, data);
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_ORGANIZATION }, locals);
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG, "organization", organizationId)) {
    const organizationDetails = await getOrganization(organizationId);
    if (organizationDetails.stripeCustomerId)
      await deleteCustomer(organizationDetails.stripeCustomerId);
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
    let result;
    if (organization.stripeCustomerId) {
      result = await updateCustomer(organization.stripeCustomerId, data);
    } else {
      result = await createCustomer(organizationId, data, updateOrganization);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
    const organization = await getOrganization(organizationId);
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
      Authorizations.READ_SECURE,
      "organization",
      organizationId
    )
  ) {
    const organization = await getOrganization(organizationId);
    const memberships = await getOrganizationMemberships(organizationId);
    let billing = {} as any;
    let subscriptions = {} as any;
    let invoices = {} as any;
    let sources = {} as any;
    if (organization.stripeCustomerId) {
      billing = await getCustomer(organization.stripeCustomerId);
      subscriptions = await getSubscriptions(organization.stripeCustomerId, {});
      invoices = await getInvoices(organization.stripeCustomerId, {});
      sources = await getSources(organization.stripeCustomerId, {});
    }
    return {
      organization,
      memberships,
      billing,
      subscriptions,
      invoices,
      sources
    };
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  query?: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  )
    return getOrganizationMemberships(organizationId, query);
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
    return getOrganizationMembershipDetailed(organizationId, membershipId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateOrganizationMembershipForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  membershipId: string,
  data: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.UPDATE_ORG_MEMBERSHIPS,
      "organization",
      organizationId
    )
  )
    return updateOrganizationMembership(organizationId, membershipId, data);
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
    // Check if there's only one member in this team
    const members = await getOrganizationMemberships(organizationId);
    if (members && members.data && members.data.length === 1)
      throw new Error(CANNOT_DELETE_SOLE_MEMBER);
    return deleteOrganizationMembership(organizationId, membershipId);
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
    const organization = await getOrganization(organizationId);
    if (organization.onlyAllowDomain) {
      const emailDomain = newMemberEmail.split("@")[1];
      try {
        const domainDetails = await getDomainByDomainName(emailDomain);
        if (!domainDetails || domainDetails.organizationId != organizationId)
          throw new Error();
      } catch (error) {
        throw new Error(CANNOT_INVITE_DOMAIN);
      }
    }
    let newUser: User;
    let userExists = false;
    let createdUserId: string;
    try {
      newUser = await getUserByEmail(newMemberEmail);
      userExists = true;
    } catch (error) {}
    if (userExists) {
      newUser = await getUserByEmail(newMemberEmail);
      if (!newUser.id) throw new Error(USER_NOT_FOUND);
      let isMemberAlready = false;
      try {
        isMemberAlready = !!(await getUserOrganizationMembership(
          newUser.id,
          organizationId
        ));
      } catch (error) {}
      createdUserId = newUser.id;
      if (isMemberAlready) throw new Error(USER_IS_MEMBER_ALREADY);
      await createMembership({ userId: newUser.id, organizationId, role });
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
        typeof userId !== "object" ? (await getUser(userId)).name : "Someone";
      const userDetails = await getUser(createdUserId);
      await mail(newMemberEmail, Templates.INVITED_TO_TEAM, {
        ...userDetails,
        team: organization.name,
        inviter
      });
    }
    return;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeysForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  query: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_API_KEYS,
      "organization",
      organizationId
    )
  )
    return getOrganizationApiKeys(organizationId, query);
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
    return getApiKey(organizationId, apiKeyId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeyLogsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string,
  query: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_API_KEY_LOGS,
      "organization",
      organizationId
    )
  )
    return getApiKeyLogs(organizationId, apiKeyId, query);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKeyId: string,
  data: KeyValue,
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
    const result = await updateApiKey(organizationId, apiKeyId, data);
    queueWebhook(organizationId, Webhooks.UPDATE_API_KEY, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createApiKeyForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  apiKey: KeyValue,
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
    const result = await createApiKey({ organizationId, ...apiKey });
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
    const result = await deleteApiKey(organizationId, apiKeyId);
    queueWebhook(organizationId, Webhooks.DELETE_API_KEY, apiKeyId);
    trackEvent({ organizationId, type: Webhooks.DELETE_API_KEY }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainsForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  query: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_DOMAINS,
      "organization",
      organizationId
    )
  )
    return getOrganizationDomains(organizationId, query);
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
    return getDomain(organizationId, domainId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domainId: string,
  data: KeyValue,
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
    const result = await updateDomain(organizationId, domainId, data);
    queueWebhook(organizationId, Webhooks.UPDATE_DOMAIN, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createDomainForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  domain: KeyValue,
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
    const result = await createDomain({
      domain: "",
      organizationId,
      ...domain,
      isVerified: false
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
    const result = await deleteDomain(organizationId, domainId);
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
    const domain = await getDomain(organizationId, domainId);
    if (domain.isVerified) throw new Error(DOMAIN_ALREADY_VERIFIED);
    if (!domain.verificationCode) throw new Error(DOMAIN_UNABLE_TO_VERIFY);
    if (method === "file") {
      try {
        const file: string = (
          await axios.get(
            `http://${domain.domain}/.well-known/${JWT_ISSUER}-verify.txt`
          )
        ).data;
        if (file.trim() === domain.verificationCode) {
          const result = await updateDomain(organizationId, domainId, {
            isVerified: true
          });
          queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN, {
            domainId,
            method
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
        const result = await updateDomain(organizationId, domainId, {
          isVerified: true
        });
        queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN, {
          domainId,
          method
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
  query: KeyValue
) => {
  if (
    await can(
      userId,
      OrgScopes.READ_ORG_WEBHOOKS,
      "organization",
      organizationId
    )
  )
    return getOrganizationWebhooks(organizationId, query);
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
    return getWebhook(organizationId, webhookId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const updateWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhookId: string,
  data: KeyValue,
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
    const result = await updateWebhook(organizationId, webhookId, data);
    queueWebhook(organizationId, Webhooks.UPDATE_WEBHOOK, data);
    trackEvent({ organizationId, type: Webhooks.UPDATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const createWebhookForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  webhook: KeyValue,
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
    const result = await createWebhook({
      organizationId,
      ...webhook
    } as Webhook);
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
    const result = await deleteWebhook(organizationId, webhookId);
    queueWebhook(organizationId, Webhooks.DELETE_WEBHOOK, webhookId);
    trackEvent({ organizationId, type: Webhooks.DELETE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const applyCouponToOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  coupon: string,
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
    const { amount, currency, description } = await verifyToken<{
      amount: number;
      currency: string;
      description?: string;
    }>(coupon, Tokens.COUPON);
    await createCustomerBalanceTransaction(organizationId, {
      amount,
      currency,
      description
    });
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};
