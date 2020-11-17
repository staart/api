import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool';
import Stripe from 'stripe';

export interface Configuration {
  frontendUrl: string;

  meta: {
    appName: string;
    domainVerificationFile: string;
  };

  caching: {
    geolocationLruSize: number;
    apiKeyLruSize: number;
  };

  rateLimit: {
    public: { points: number; duration: number };
    authenticated: { points: number; duration: number };
    apiKey: { points: number; duration: number };
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
    retries: number;
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

  elasticSearch: {
    node: string;
    retries: number;
    auth?: BasicAuth | ApiKeyAuth;
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
  };

  webhooks: {
    retries: number;
  };

  sms: {
    retries: number;
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

  tracking: {
    mode: 'all' | 'api-key' | 'authenticated';
    index: string;
    deleteOldLogs: boolean;
    deleteOldLogsDays: number;
  };

  slack: {
    token: string;
    slackApiUrl?: string;
    rejectRateLimitedCalls?: boolean;
    retries: number;
  };

  airtable: {
    apiKey: string;
    endpointUrl?: string;
  };

  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket?: string;
  };

  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };

  firebase: {
    serviceAccountKey:
      | string
      | { projectId?: string; clientEmail?: string; privateKey?: string };
    databaseUrl: string;
  };

  github: {
    auth: string;
    userAgent?: string;
  };

  googleMaps: {
    apiKey: string;
  };
}
