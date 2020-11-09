import Stripe from 'stripe';

export interface Configuration {
  frontendUrl: string;

  meta: {
    totpServiceName: string;
    domainVerificationFile: string;
  };

  caching: {
    geolocationLruSize: number;
    apiKeyLruSize: number;
  };

  security: {
    saltRounds: number;
    jwtSecret: string;
    totpWindowPast: number;
    totpWindowFuture: number;
    mfaTokenExpiry: string;
    mergeUsersTokenExpiry: string;
    accessTokenExpiry: string;
    passwordPwnedCheck: boolean;
    unusedRefreshTokenExpiryDays: number;
    inactiveUserDeleteDays: number;
  };

  email: {
    name: string;
    from: string;
    ses?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
    transport?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
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
    stripeEndpointSecret: string;
    paymentMethodTypes: Array<
      Stripe.Checkout.SessionCreateParams.PaymentMethodType
    >;
  };
}
