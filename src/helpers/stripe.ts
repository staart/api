import Stripe from "stripe";
import chargebee, { Customer } from "chargebee";
import {
  STRIPE_SECRET_KEY,
  CHARGEBEE_SECRET_KEY,
  CHARGEBEE_SITE
} from "../config";
import { updateOrganization } from "../crud/organization";
const stripe = new Stripe(STRIPE_SECRET_KEY);
chargebee.configure({
  api_key: CHARGEBEE_SECRET_KEY,
  site: CHARGEBEE_SITE
});

/**
 * @param id - Stripe customer ID
 */
export const getStripeCustomer = (id: string) =>
  new Promise((resolve, reject) => {
    chargebee.customer.retrieve(id).request((error: any, result: any) => {
      if (error) return reject(error);
      resolve(result.customer as Customer);
    });
  });

/**
 */
export const createStripeCustomer = async (
  organizationId: number,
  customer: Stripe.customers.ICustomerCardSourceCreationOptions
) => {
  return new Promise((resolve, reject) => {
    chargebee.customer
      .create(customer)
      .request((error: any, result: Customer) => {
        if (error) return reject(error);
        const stripeCustomerId = result.customer.id;
        updateOrganization(organizationId, { stripeCustomerId })
          .then(() => {
            resolve(result);
          })
          .catch(error => reject(error));
      });
  });
};

/**
 * @param id - Stripe customer ID
 */
export const deleteStripeCustomer = async (id: string) => {
  // TODO
  return;
};

/**
 * Update the details of a customer
 */
export const updateStripeCustomer = async (
  id: string,
  customer: Stripe.customers.ICustomerUpdateOptions
) =>
  new Promise((resolve, reject) => {
    chargebee.customer
      .update(id, customer)
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result.customer as Customer);
      });
  });

/**
 * @param id - Stripe customer ID
 */
export const getStripeInvoices = async (id: string) =>
  new Promise((resolve, reject) => {
    chargebee.invoice
      .list({
        "customer_id[is]": id
      })
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result as any);
      });
  });

/**
 * @param id - Stripe customer ID
 */
export const getStripeSubscriptions = async (id: string) =>
  new Promise((resolve, reject) => {
    chargebee.subscription
      .list({
        "customer_id[is]": id
      })
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result.list as any);
      });
  });

/**
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
 * @param id - Stripe customer ID
 */
export const getStripeSources = async (id: string) =>
  new Promise((resolve, reject) => {
    chargebee.payment_source
      .list({
        "customer_id[is]": id
      })
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result.list as any);
      });
  });

/**
 * @param id - Stripe customer ID
 */
export const getStripeSource = async (id: string, sourceId: string) =>
  new Promise((resolve, reject) => {
    chargebee.subscription
      .retrieve(sourceId)
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result as any);
      });
  });

/**
 * @param id - Stripe customer ID
 */
export const deleteStripeSource = async (id: string, sourceId: string) => {
  // TODO
  return;
};

/**
 * @param id - Stripe customer ID
 */
export const createStripeSource = (
  id: string,
  card: Stripe.cards.ISourceCreationOptionsExtended
) =>
  new Promise((resolve, reject) => {
    chargebee.payment_source
      .create_card({
        customer_id: id,
        card
      })
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result as any);
      });
  });

/**
 * @param id - Stripe customer ID
 */
export const updateStripeSource = async (
  id: string,
  cardId: string,
  data: Stripe.cards.ISourceCreationOptionsExtended
) =>
  new Promise((resolve, reject) => {
    chargebee.payment_source
      .update_card(cardId, data)
      .request((error: any, result: any) => {
        if (error) return reject(error);
        resolve(result as any);
      });
  });
