import Stripe from 'stripe';

export interface Configuration {
  frontendUrl: string;

  meta: {
    totpServiceName: string;
  };

  caching: {
    geolocationLruSize: number;
  };

  security: {
    saltRounds: number;
    jwtSecret: string;
    totpWindowPast: number;
    totpWindowFuture: number;
    mfaTokenExpiry: string;
    accessTokenExpiry: string;
    passwordPwnedCheck: boolean;
    unusedRefreshTokenExpiryDays: number;
  };

  email: {
    name: string;
    from: string;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  sms: {
    smsServiceName: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
  };

  payments: {
    stripeApiKey: string;
    stripeProductId: string;
    paymentMethodTypes: Array<
      Stripe.Checkout.SessionCreateParams.PaymentMethodType
    >;
  };
}
