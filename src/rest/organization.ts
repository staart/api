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
  getOrganizationMembershipDetailed
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
  Authorizations
} from "../interfaces/enum";
import {
  createEvent,
  getOrganizationEvents,
  getOrganizationRecentEvents
} from "../crud/event";
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

export const getOrganizationForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
) => {
  if (await can(userId, OrgScopes.READ_ORG, "organization", organizationId))
    return await getOrganization(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: number,
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
  await createStripeCustomer(organizationId, {
    email: await getUserPrimaryEmail(userId),
    name: (await getUser(userId)).name
  });
  await createEvent(
    {
      userId,
      organizationId,
      type: EventType.ORGANIZATION_CREATED,
      data: { id: org.insertId }
    },
    locals
  );
  return;
};

export const updateOrganizationForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  data: Organization,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.UPDATE_ORG, "organization", organizationId)) {
    await updateOrganization(organizationId, data);
    queueWebhook(organizationId, Webhooks.UPDATE_ORGANIZATION);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  locals: Locals
) => {
  if (await can(userId, OrgScopes.DELETE_ORG, "organization", organizationId)) {
    const organizationDetails = await getOrganization(organizationId);
    if (organizationDetails.stripeCustomerId)
      await deleteStripeCustomer(organizationDetails.stripeCustomerId);
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
    queueWebhook(organizationId, Webhooks.DELETE_ORGANIZATION);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationBillingForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoicesForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  subscriptionId: string,
  data: KeyValue
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
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createOrganizationSubscriptionForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  params: { plan: string; [index: string]: any }
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
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
) => {
  if (
    await can(userId, OrgScopes.READ_ORG_PLANS, "organization", organizationId)
  )
    return await getStripeProductPricing();
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationSourceForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  sourceId: string
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
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateOrganizationSourceForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  sourceId: string,
  data: any
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
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createOrganizationSourceForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  card: any
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
      return result;
    }
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getAllOrganizationDataForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
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
    const events = await getOrganizationEvents(organizationId);
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
      events,
      billing,
      subscriptions,
      invoices,
      sources
    };
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationRecentEventsForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
) => {
  if (
    await can(
      userId,
      Authorizations.READ_SECURE,
      "organization",
      organizationId
    )
  )
    return await getOrganizationRecentEvents(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  membershipId: number
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  membershipId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  membershipId: number
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
      if (isMemberAlready) throw new Error(ErrorCode.USER_IS_MEMBER_ALREADY);
      await createMembership({ userId: newUser.id, organizationId, role });
      return;
    } else {
      await register(
        { name: newMemberName },
        locals,
        newMemberEmail,
        organizationId,
        role
      );
      return;
    }
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeysForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  apiKeyId: number
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

export const updateApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  apiKeyId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteApiKeyForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  apiKeyId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainsForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  domainId: number
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  domainId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createDomainForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteDomainForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  domainId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const verifyDomainForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  domainId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  webhookId: number
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
  userId: number | ApiKeyResponse,
  organizationId: number,
  webhookId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createWebhookForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteWebhookForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  webhookId: number,
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
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
