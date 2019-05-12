import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../config";
const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * Get the details of a customer
 * @param id - Stripe customer ID
 */
export const getStripeCustomer = async (id: string) => {
  const customer = await stripe.customers.retrieve(id);
};
