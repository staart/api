import { Organization, Webhook } from "../interfaces/tables/organization";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization,
  getOrganizationApiKeys,
  getApiKey,
  updateApiKey,
  createApiKey,
  deleteApiKey,
  getOrganizationDomains,
  getDomain,
  updateDomain,
  createDomain,
  deleteDomain,
  checkDomainAvailability,
  getOrganizationWebhooks,
  getWebhook,
  updateWebhook,
  createWebhook,
  deleteWebhook,
  getOrganizationMemberships,
  deleteAllOrganizationMemberships,
  updateOrganizationMembership,
  deleteOrganizationMembership,
  getDomainByDomainName,
  getOrganizationMembershipDetailed,
  getApiKeyLogs
} from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import {
  createMembership,
  getUserOrganizationMembership
} from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  EventType,
  Webhooks,
  OrgScopes,
  Authorizations,
  Templates
} from "../interfaces/enum";
import { Locals, KeyValue } from "../interfaces/general";
import { can } from "../helpers/authorization";
import {
  getStripeCustomer,
  createStripeCustomer,
  updateStripeCustomer,
  getStripeInvoices,
  getStripeSubscriptions,
  getStripeProductPricing,
  getStripeSources,
  getStripeSource,
  createStripeSource,
  updateStripeSource,
  deleteStripeSource,
  deleteStripeCustomer,
  getStripeSubscription,
  updateStripeSubscription,
  getStripeInvoice,
  createStripeSubscription
} from "../crud/billing";
import { getUser, getUserByEmail } from "../crud/user";
import { getUserPrimaryEmail } from "../crud/email";
import { ApiKeyResponse } from "../helpers/jwt";
import axios from "axios";
import { dnsResolve } from "../helpers/utils";
import { JWT_ISSUER } from "../config";
import { queueWebhook } from "../helpers/webhooks";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";
import { trackEvent } from "../helpers/tracking";
import { mail } from "../helpers/mail";

export const getOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string
) => {
  if (await can(userId, OrgScopes.READ_ORG, "organization", organizationId))
    return await getOrganization(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: string,
  organization: Organization,
  locals: Locals
) => {
  if (!organization.name) {
    const user = await getUser(userId);
    organization.name = `${user.name}'s Team`;
  }
  const org = <InsertResult>await createOrganization(organization);
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
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION);
    trackEvent({ organizationId, type: Webhooks.UPDATE_ORGANIZATION }, locals);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG, "organization", organizationId)) {
    const organizationDetails = await getOrganization(organizationId);
    if (organizationDetails.stripeCustomerId)
      await deleteStripeCustomer(organizationDetails.stripeCustomerId);
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
    queueWebhook(organizationId, Webhooks.DELETE_ORGANIZATION);
    trackEvent({ organizationId, type: Webhooks.DELETE_ORGANIZATION }, locals);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeCustomer(organization.stripeCustomerId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      result = await updateStripeCustomer(organization.stripeCustomerId, data);
    } else {
      result = await createStripeCustomer(organizationId, data);
    }
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION_BILLING);
    trackEvent(
      { organizationId, type: Webhooks.UPDATE_ORGANIZATION_BILLING },
      locals
    );
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeInvoices(organization.stripeCustomerId, params);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeInvoice(organization.stripeCustomerId, invoiceId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeSources(organization.stripeCustomerId, params);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeSource(organization.stripeCustomerId, sourceId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeSubscriptions(
        organization.stripeCustomerId,
        params
      );
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      return await getStripeSubscription(
        organization.stripeCustomerId,
        subscriptionId
      );
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      const result = await updateStripeSubscription(
        organization.stripeCustomerId,
        subscriptionId,
        data
      );
      queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION);
      trackEvent(
        { organizationId, type: Webhooks.UPDATE_ORGANIZATION_SUBSCRIPTION },
        locals
      );
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      const result = await createStripeSubscription(
        organization.stripeCustomerId,
        params
      );
      queueWebhook(organizationId, Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION);
      trackEvent(
        { organizationId, type: Webhooks.CREATE_ORGANIZATION_SUBSCRIPTION },
        locals
      );
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: string | ApiKeyResponse,
  organizationId: string
) => {
  if (
    await can(userId, OrgScopes.READ_ORG_PLANS, "organization", organizationId)
  )
    return await getStripeProductPricing();
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      const result = await deleteStripeSource(
        organization.stripeCustomerId,
        sourceId
      );
      queueWebhook(organizationId, Webhooks.DELETE_ORGANIZATION_SOURCE);
      trackEvent(
        { organizationId, type: Webhooks.DELETE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      const result = await updateStripeSource(
        organization.stripeCustomerId,
        sourceId,
        data
      );
      queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION_SOURCE);
      trackEvent(
        { organizationId, type: Webhooks.UPDATE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      const result = await createStripeSource(
        organization.stripeCustomerId,
        card
      );
      queueWebhook(organizationId, Webhooks.CREATE_ORGANIZATION_SOURCE);
      trackEvent(
        { organizationId, type: Webhooks.CREATE_ORGANIZATION_SOURCE },
        locals
      );
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
      billing = await getStripeCustomer(organization.stripeCustomerId);
      subscriptions = await getStripeSubscriptions(
        organization.stripeCustomerId,
        {}
      );
      invoices = await getStripeInvoices(organization.stripeCustomerId, {});
      sources = await getStripeSources(organization.stripeCustomerId, {});
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
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getOrganizationMemberships(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getOrganizationMembershipDetailed(
      organizationId,
      membershipId
    );
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await updateOrganizationMembership(
      organizationId,
      membershipId,
      data
    );
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
  )
    return await deleteOrganizationMembership(organizationId, membershipId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
        throw new Error(ErrorCode.CANNOT_INVITE_DOMAIN);
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
      if (!newUser.id) throw new Error(ErrorCode.USER_NOT_FOUND);
      let isMemberAlready = false;
      try {
        isMemberAlready = !!(await getUserOrganizationMembership(
          newUser.id,
          organizationId
        ));
      } catch (error) {}
      createdUserId = newUser.id;
      if (isMemberAlready) throw new Error(ErrorCode.USER_IS_MEMBER_ALREADY);
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
      const email = await getUserPrimaryEmail(createdUserId);
      if (email)
        await mail(email, Templates.INVITED_TO_TEAM, {
          ...userDetails,
          team: organization.name,
          inviter
        });
    }
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getOrganizationApiKeys(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getApiKey(organizationId, apiKeyId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getApiKeyLogs(organizationId, apiKeyId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.UPDATE_API_KEY);
    trackEvent({ organizationId, type: Webhooks.UPDATE_API_KEY }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.CREATE_API_KEY);
    trackEvent({ organizationId, type: Webhooks.CREATE_API_KEY }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.DELETE_API_KEY);
    trackEvent({ organizationId, type: Webhooks.DELETE_API_KEY }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getOrganizationDomains(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getDomain(organizationId, domainId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.UPDATE_DOMAIN);
    trackEvent({ organizationId, type: Webhooks.UPDATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.CREATE_DOMAIN);
    trackEvent({ organizationId, type: Webhooks.CREATE_DOMAIN }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.DELETE_DOMAIN);
    trackEvent({ organizationId, type: Webhooks.DELETE_DOMAIN }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    if (domain.isVerified) throw new Error(ErrorCode.DOMAIN_ALREADY_VERIFIED);
    if (!domain.verificationCode)
      throw new Error(ErrorCode.DOMAIN_UNABLE_TO_VERIFY);
    if (method === "file") {
      try {
        const file: string = (await axios.get(
          `http://${domain.domain}/.well-known/${JWT_ISSUER}-verify.txt`
        )).data;
        if (file.trim() === domain.verificationCode) {
          const result = await updateDomain(organizationId, domainId, {
            isVerified: true
          });
          queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN);
          trackEvent({ organizationId, type: Webhooks.VERIFY_DOMAIN }, locals);
          return result;
        }
      } catch (error) {
        throw new Error(ErrorCode.DOMAIN_MISSING_FILE);
      }
    } else {
      const dns = await dnsResolve(domain.domain, "TXT");
      if (JSON.stringify(dns).includes(domain.verificationCode)) {
        const result = await updateDomain(organizationId, domainId, {
          isVerified: true
        });
        queueWebhook(organizationId, Webhooks.VERIFY_DOMAIN);
        trackEvent({ organizationId, type: Webhooks.VERIFY_DOMAIN }, locals);
        return result;
      } else {
        throw new Error(ErrorCode.DOMAIN_MISSING_DNS);
      }
    }
    throw new Error(ErrorCode.DOMAIN_UNABLE_TO_VERIFY);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getOrganizationWebhooks(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    return await getWebhook(organizationId, webhookId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.UPDATE_WEBHOOK);
    trackEvent({ organizationId, type: Webhooks.UPDATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.CREATE_WEBHOOK);
    trackEvent({ organizationId, type: Webhooks.CREATE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
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
    queueWebhook(organizationId, Webhooks.DELETE_WEBHOOK);
    trackEvent({ organizationId, type: Webhooks.DELETE_WEBHOOK }, locals);
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
