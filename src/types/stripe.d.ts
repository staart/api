import Stripe from "stripe";

export type StripeCheckoutSession = {
  /**
   *   Unique identifier for the object. Used to pass to redirectToCheckout in Stripe.js.
   */
  id: string;

  /**
   *   String representing the object’s type. Objects of the same type share the same value.
   */
  object: "checkout.session";

  /**
   *   The value (auto or required) for whether Checkout collected the customer’s billing address.
   */
  billing_address_collection: "auto" | "required";

  /**
   *   The URL the customer will be directed to if they decide to cancel payment and return to your website.
   */
  cancel_url: string;

  /**
   *   A unique string to reference the Checkout Session. This can be a customer ID, a cart ID, or similar, and can be used to reconcile the session with your internal systems.
   */
  client_reference_id?: string;

  /**
   *   The ID of the customer for this session. A new customer will be created unless an existing customer was provided in when the session was created.
   */
  customer: string;

  /**
   *   If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
   */
  customer_email: string;

  /**
   *   The line items, plans, or SKUs purchased by the customer.
   */
  display_items: Array<{
    /**
     *     Amount for the display item.
     */
    amount: number;

    /**
     *     Three-letter ISO currency code, in lowercase. Must be a supported currency.
     */
    /** TODO: Replace string with supported currencies. */
    currency: string;

    custom: {
      /**
       *       The description of the line item.
       */
      description: string;

      /**
       *       The images of the line item.
       */
      images: string[];

      /**
       *       The name of the line item.
       */
      name: string;
    };
    /**
     *     Quantity of the display item being purchased.
     */
    quantity: number;

    /**
     *     The type of display item. One of custom, plan or sku
     */
    type: string;

    /** TODO: Replace {} with sku object */
    sku: {};

    /** TODO: Replace {} with plan object */
    plan: {};
  }>;
  /**
   *   Has the value true if the object exists in live mode or the value false if the object exists in test mode.
   */
  livemode: boolean;

  /**
   *   The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser’s locale is used.
   */
  locale:
    | "auto"
    | "da"
    | "de"
    | "en"
    | "es"
    | "fi"
    | "fr"
    | "it"
    | "ja"
    | "nb"
    | "nl"
    | "pl"
    | "pt"
    | "sv"
    | "zh";

  /**
   *   The ID of the PaymentIntent created if SKUs or line items were provided.
   */
  payment_intent: string;

  /**
   *   A list of the types of payment methods (e.g. card) this Checkout Session is allowed to accept.
   */
  payment_method_types: string[];

  /**
   *   The ID of the subscription created if one or more plans were provided.
   */
  subscription?: string;

  /**
   *   The URL the customer will be directed to after the payment or subscription creation is successful.
   */
  success_url: string;
};

export type StripeCheckoutSessionCreateParams = {
  /**
   *   The URL the customer will be directed to if they decide to cancel payment and return to your website.
   */
  cancel_url: string;

  /**
   *   A list of the types of payment methods (e.g. card) this Checkout Session is allowed to accept. The only supported value today is card.
   */
  payment_method_types: string[];

  /**
   *   The URL the customer will be directed to after the payment or subscription creation is successful.
   */
  success_url: string;

  /**
   *   Specify whether Checkout should collect the customer’s billing address. If set to required, Checkout will always collect the customer’s billing address. If left blank or set to auto Checkout will only collect the billing address when necessary.
   */
  billing_address_collection?: "required" | "auto";

  /**
   *   A unique string to reference the Checkout Session. This can be a customer ID, a cart ID, or similar, and can be used to reconcile the session with your internal systems.
   */
  client_reference_id?: string;

  /**
   *   ID of an existing customer paying for this session, if one exists. May only be used with line_items. Usage with subscription_data is not yet available. If blank, Checkout will create a new customer object based on information provided during the session. The email stored on the customer will be used to prefill the email field on the Checkout page. If the customer changes their email on the Checkout page, the Customer object will be updated with the new email.
   */
  customer?: string;

  /**
   *   If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
   */
  customer_email?: string;

  /**
   *   A list of items the customer is purchasing. Use this parameter for one-time payments. To create subscriptions, use subscription_data.items.
   */
  line_items?: Array<{
    /**
     *     The amount to be collected per unit of the line item.
     */
    amount: number;

    /**
     *     Three-letter ISO currency code, in lowercase. Must be a supported currency.
     */
    currency: string;

    /**
     *     The name for the line item.
     */
    name: string;

    /**
     *     The quantity of the line item being purchased.
     */
    quantity: number;

    /**
     *     The description for the line item.
     */
    description?: string;

    /**
     *     A list of images representing this line item.
     */
    images?: string[];
  }>;

  /**
   *   The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser’s locale is used.
   */
  locale?:
    | "auto"
    | "da"
    | "de"
    | "en"
    | "es"
    | "fi"
    | "fr"
    | "it"
    | "ja"
    | "nb"
    | "nl"
    | "pl"
    | "pt"
    | "sv"
    | "zh";

  /**
   *   A subset of parameters to be passed to PaymentIntent creation.
   */
  payment_intent_data?: {
    /**
     *     The amount of the application fee (if any) that will be applied to the payment and transferred to the application owner’s Stripe account. To use an application fee, the request must be made on behalf of another account, using the Stripe-Account header or an OAuth key. For more information, see the PaymentIntents Connect usage guide.
     */
    application_fee_amount?: number;

    /**
     *     Capture method of this PaymentIntent, one of automatic or manual.
     */
    capture_method?: "automatic" | "manual";

    /**
     *     An arbitrary string attached to the object. Often useful for displaying to users. This can be unset by updating the value to null and then saving.
     */
    description?: string;

    /**
     *     Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
     *     Metadata values can't be longer than 500 characters.
     */
    metadata?: {
      [key: string]: string;
    };

    /**
     *     The Stripe account ID for which these funds are intended. For details, see the PaymentIntents Connect usage guide.
     */
    on_behalf_of?: string;

    /**
     *     Email address that the receipt for the resulting payment will be sent to.
     */
    receipt_email?: string;

    /**
     *     Shipping information for this payment.
     */
    shipping?: {
      address: {
        line1: string;
        city: string;
        country: string;
        line2: string;
        postal_code: string;
        state: string;
      };
    };

    /**
     *     Extra information about the payment. This will appear on your customer’s statement when this payment succeeds in creating a charge.
     */
    statement_descriptor?: string;

    /**
     *     The parameters used to automatically create a Transfer when the payment succeeds. For more information, see the PaymentIntents Connect usage guide.
     */
    transfer_data?: {
      /**
       *       If specified, successful charges will be attributed to the destination account for tax reporting, and the funds from charges will be transferred to the destination account. The ID of the resulting transfer will be returned on the successful charge’s transfer field.
       */
      destination: string;
    };
  };
  subscription_data?: {
    /**
     *     A list of items, each with an attached plan, that the customer is subscribing to. Use this parameter for subscriptions. To create one-time payments, use line_items.
     */
    items: {
      /**
       *       Plan ID for this item.
       */
      plan: string;

      /**
       *       Quantity for this item.
       */
      quantity?: number;
    };

    /**
     *     Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
     *     Metadata values can't be longer than 500 characters.
     */
    metadata?: {
      [key: string]: string;
    };

    /**
     *     Unix timestamp representing the end of the trial period the customer will get before being charged for the first time. Has to be at least 48h in the future.
     */
    trial_end?: string;

    /**
     *     Integer representing the number of trial period days before the customer is charged for the first time.Has to be at least 1.
     */
    trial_period_days?: number;
  };
};

export default interface IStripeInterface extends Stripe {
  checkout: {
    sessions: {
      create: (
        params: StripeCheckoutSessionCreateParams
      ) => Promise<StripeCheckoutSession>;
    };
  };
}
