import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config";
import { updateOrganization } from "../crud/organization";
const stripe = new Stripe(STRIPE_SECRET_KEY);

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
  return created;
};

/**
 * Update the details of a customer
 */
export const updateStripeCustomer = async (
  id: string,
  customer: Stripe.customers.ICustomerUpdateOptions
) => {
  return await stripe.customers.update(id, customer);
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
export const getStripeSubscriptions = async (id: string) => {
  return await stripe.subscriptions.list({ customer: id });
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
