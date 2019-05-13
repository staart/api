import { Organization } from "../interfaces/tables/organization";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization
} from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import {
  createMembership,
  deleteAllOrganizationMemberships
} from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  EventType,
  Authorizations
} from "../interfaces/enum";
import { createEvent } from "../crud/event";
import { Locals } from "../interfaces/general";
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
  deleteStripeCustomer
} from "../helpers/stripe";
import { customers, cards } from "stripe";

export const getOrganizationForUser = async (
  userId: number,
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
  userId: number,
  organizationId: number,
  data: Organization,
  locals: Locals
) => {
  if (
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
  ) {
    await updateOrganization(organizationId, data);
    await createEvent(
      {
        userId,
        organizationId,
        type: EventType.ORGANIZATION_UPDATED,
        data: { id: organizationId, data }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: number,
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
    await createEvent(
      {
        userId,
        organizationId,
        type: EventType.ORGANIZATION_DELETED,
        data: { id: organizationId }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationBillingForUser = async (
  userId: number,
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
  userId: number,
  organizationId: number,
  data: customers.ICustomerCardSourceCreationOptions,
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
    await createEvent(
      {
        userId,
        organizationId,
        type: EventType.BILLING_UPDATED,
        data
      },
      locals
    );
    return result;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationInvoicesForUser = async (
  userId: number,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await getStripeInvoices(organization.stripeCustomerId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationSubscriptionsForUser = async (
  userId: number,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await getStripeSubscriptions(organization.stripeCustomerId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationPricingPlansForUser = async (
  userId: number,
  organizationId: number,
  productId: string
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getStripeProductPricing(productId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourcesForUser = async (
  userId: number,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId)) {
    const organization = await getOrganization(organizationId);
    if (organization.stripeCustomerId)
      return await getStripeSources(organization.stripeCustomerId);
    throw new Error(ErrorCode.STRIPE_NO_CUSTOMER);
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getOrganizationSourceForUser = async (
  userId: number,
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

export const deleteOrganizationSourceForUser = async (
  userId: number,
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
  userId: number,
  organizationId: number,
  sourceId: string,
  data: cards.ISourceCreationOptionsExtended
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
  userId: number,
  organizationId: number,
  card: cards.ISourceCreationOptionsExtended
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
