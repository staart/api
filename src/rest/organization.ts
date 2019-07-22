import { Organization } from "../interfaces/tables/organization";
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
  checkDomainAvailability
} from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import {
  createMembership,
  deleteAllOrganizationMemberships,
  getOrganizationMemberDetails
} from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  EventType,
  Authorizations,
  NotificationCategories
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
  createStripeSubscriptionSession,
  createStripeSubscription
} from "../crud/billing";
import { getUser } from "../crud/user";
import { getUserPrimaryEmail } from "../crud/email";
import { ApiKeyResponse } from "../helpers/jwt";
import axios from "axios";
import { dnsResolve } from "../helpers/utils";
import { JWT_ISSUER } from "../config";

export const getOrganizationForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
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
  if (
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
  ) {
    await updateOrganization(organizationId, data);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  locals: Locals
) => {
  if (
    await can(userId, Authorizations.DELETE, "organization", organizationId)
  ) {
    const organizationDetails = await getOrganization(organizationId);
    if (organizationDetails.stripeCustomerId)
      await deleteStripeCustomer(organizationDetails.stripeCustomerId);
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationBillingForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    let result;
    if (organization.stripeCustomerId) {
      result = await updateStripeCustomer(organization.stripeCustomerId, data);
    } else {
      result = await createStripeCustomer(organizationId, data);
    }
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoicesForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  params: KeyValue
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
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
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await updateStripeSubscription(
        organization.stripeCustomerId,
        subscriptionId,
        data
      );
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createOrganizationSubscriptionForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  params: { plan: string; [index: string]: any }
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await createStripeSubscription(
        organization.stripeCustomerId,
        params
      );
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  productId: string
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getStripeProductPricing(productId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationSourceForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  sourceId: string
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await deleteStripeSource(organization.stripeCustomerId, sourceId);
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
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
  ) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await updateStripeSource(
        organization.stripeCustomerId,
        sourceId,
        data
      );
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
    await can(userId, Authorizations.CREATE, "organization", organizationId)
  ) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await createStripeSource(organization.stripeCustomerId, card);
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
    const memberships = await getOrganizationMemberDetails(organizationId);
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
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganizationRecentEvents(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  query?: KeyValue
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganizationMemberDetails(organizationId, query);
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
      Authorizations.READ_SECURE,
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
      Authorizations.READ_SECURE,
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
      Authorizations.UPDATE_SECURE,
      "organization",
      organizationId
    )
  ) {
    await updateApiKey(organizationId, apiKeyId, data);
    return;
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
      Authorizations.CREATE_SECURE,
      "organization",
      organizationId
    )
  ) {
    const key = await createApiKey({ organizationId, ...apiKey });
    return;
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
      Authorizations.DELETE_SECURE,
      "organization",
      organizationId
    )
  ) {
    await deleteApiKey(organizationId, apiKeyId);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainsForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  query: KeyValue
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganizationDomains(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationDomainForUser = async (
  userId: number | ApiKeyResponse,
  organizationId: number,
  domainId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
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
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
  ) {
    await updateDomain(organizationId, domainId, data);
    return;
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
    await can(userId, Authorizations.CREATE, "organization", organizationId)
  ) {
    await checkDomainAvailability(domain.domain);
    const key = await createDomain({
      domain: "",
      organizationId,
      ...domain,
      isVerified: false
    });
    return;
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
    await can(userId, Authorizations.DELETE, "organization", organizationId)
  ) {
    await deleteDomain(organizationId, domainId);
    return;
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
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
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
          await updateDomain(organizationId, domainId, { isVerified: true });
          return;
        }
      } catch (error) {
        throw new Error(ErrorCode.DOMAIN_MISSING_FILE);
      }
    } else {
      const dns = await dnsResolve(domain.domain, "TXT");
      if (JSON.stringify(dns).includes(domain.verificationCode)) {
        await updateDomain(organizationId, domainId, { isVerified: true });
        return;
      } else {
        throw new Error(ErrorCode.DOMAIN_MISSING_DNS);
      }
    }
    throw new Error(ErrorCode.DOMAIN_UNABLE_TO_VERIFY);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
