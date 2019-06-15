import Stripe, { subscriptions, IList } from "stripe";
import { STRIPE_SECRET_KEY } from "../config";
import { updateOrganization } from "./organization";
import { ErrorCode } from "../interfaces/enum";
const stripe = new Stripe(STRIPE_SECRET_KEY);

const cleanStripeResponse = (response: IList<any>) => {
  const newResponse = { ...response } as any;
  newResponse.hasMore = response.has_more;
  if (newResponse.hasMore) {
    newResponse.next = response.data[response.data.length - 1].id;
  }
  delete newResponse.has_more;
  delete newResponse.object;
  delete newResponse.url;
  return newResponse;
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeCustomer = async (id: string) => {
  return await stripe.customers.retrieve(id);
};

/**
 * Get the details of a customer
 */
export const createStripeCustomer = async (
  organizationId: number,
  customer: Stripe.customers.ICustomerCardSourceCreationOptions
) => {
  const created = await stripe.customers.create({
    ...customer,
    metadata: { organizationId }
  });
  await updateOrganization(organizationId, { stripeCustomerId: created.id });
  return { success: true, message: "billing-subscription-created" };
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const deleteStripeCustomer = async (id: string) => {
  await stripe.customers.del(id);
  return { success: true, message: "billing-customer-deleted" };
};

/**
 * Update the details of a customer
 */
export const updateStripeCustomer = async (
  id: string,
  customer: Stripe.customers.ICustomerUpdateOptions
) => {
  await stripe.customers.update(id, customer);
  return { success: true, message: "billing-customer-updated" };
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeInvoices = async (id: string) => {
  return await stripe.invoices.list({ customer: id });
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeSubscriptions = async (
  id: string,
  {
    start,
    billing,
    itemsPerPage,
    plan,
    status
  }: {
    start?: string;
    billing?: subscriptions.SubscriptionBilling;
    itemsPerPage?: number;
    plan?: string;
    status?: subscriptions.SubscriptionStatus;
  }
) => {
  return cleanStripeResponse(
    await stripe.subscriptions.list({
      customer: id,
      starting_after: start !== "0" ? start : undefined,
      billing,
      limit: itemsPerPage,
      plan,
      status
    })
  );
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeSubscription = async (
  id: string,
  subscriptionId: string
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.customer !== id)
    throw new Error(ErrorCode.SUBSCRIPTION_NOT_FOUND);
  return subscription;
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const updateStripeSubscription = async (
  id: string,
  subscriptionId: string,
  data: subscriptions.ISubscriptionUpdateItem
) => {
  await getStripeSubscription(id, subscriptionId);
  await stripe.subscriptions.update(subscriptionId, data);
  return { success: true, message: "billing-subscription-updated" };
};

/**
 * Create a new subscription
 * @param id - Stripe customer ID
 */
export const createStripeSubscription = async (
  id: string,
  {
    tax_percent,
    plan,
    billing,
    number_of_seats
  }: {
    tax_percent?: number;
    plan: string;
    billing?: subscriptions.SubscriptionBilling;
    number_of_seats?: number;
  }
) => {
  await stripe.subscriptions.create({
    customer: id,
    tax_percent,
    trial_from_plan: true,
    items: [{ plan, quantity: number_of_seats }],
    billing
  });
  return { success: true, message: "billing-subscription-created" };
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeProductPricing = async (product: string) => {
  const plans = await stripe.plans.list({ product });
  // If you have a custom plan for a client, don't show that
  plans.data = plans.data.filter(
    plan => !(plan.nickname || "").toLowerCase().startsWith("custom plan")
  );
  return plans;
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeSources = async (id: string) => {
  return await stripe.customers.listSources(id, { object: "card" });
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeSource = async (id: string, sourceId: string) => {
  return await stripe.customers.retrieveSource(id, sourceId);
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const deleteStripeSource = async (id: string, sourceId: string) => {
  await stripe.customers.deleteSource(id, sourceId);
  return { success: true, message: "billing-source-deleted" };
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const createStripeSource = async (id: string, card: any) => {
  await stripe.customers.createCard(id, { card });
  return { success: true, message: "billing-source-created" };
};

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const updateStripeSource = async (
  id: string,
  cardId: string,
  data: any
) => {
  await stripe.customers.updateCard(id, cardId, data);
  return { success: true, message: "billing-source-updated" };
};
