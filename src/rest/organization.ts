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
  deleteApiKey
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
  NotificationCategories,
  ApiKeyAccess
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
  createStripeSubscriptionSession
} from "../crud/billing";
import { getUser } from "../crud/user";
import { ApiKey } from "../interfaces/tables/user";

export const getOrganizationForUser = async (
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
  organizationId: number,
  params: { plan: string; [index: string]: any }
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await createStripeSubscriptionSession(
        organization.stripeCustomerId,
        params
      );
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: number | ApiKey,
  organizationId: number,
  productId: string
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getStripeProductPricing(productId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationSourceForUser = async (
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
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
  userId: number | ApiKey,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganizationRecentEvents(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationMembershipsForUser = async (
  userId: number | ApiKey,
  organizationId: number,
  query?: KeyValue
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganizationMemberDetails(organizationId, query);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationApiKeysForUser = async (
  userId: number | ApiKey,
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
  userId: number | ApiKey,
  organizationId: number,
  apiKey: string
) => {
  if (
    await can(
      userId,
      Authorizations.READ_SECURE,
      "organization",
      organizationId
    )
  )
    return await getApiKey(organizationId, apiKey);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const updateApiKeyForUser = async (
  userId: number | ApiKey,
  organizationId: number,
  apiKey: string,
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
    await updateApiKey(organizationId, apiKey, data);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const createApiKeyForUser = async (
  userId: number | ApiKey,
  organizationId: number,
  access: ApiKeyAccess,
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
    const apiKey = await createApiKey({ organizationId, access });
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteApiKeyForUser = async (
  userId: number | ApiKey,
  organizationId: number,
  apiKey: string,
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
    await deleteApiKey(organizationId, apiKey);
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};
