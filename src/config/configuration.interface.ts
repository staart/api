import { ApiKeyAuth, BasicAuth } from '@elastic/elasticsearch/lib/pool';
import Stripe from 'stripe';

export interface Configuration {
  /** Project name and other metadata */
  meta: {
    /**
     * Frontend URL (Staart UI or compatible app)
     * Used for redirects and links in emails
     */
    frontendUrl: string;
    /**
     * Title cased application name
     * Used as the "Issuer" in MFA TOTP and in SMS OTPs
     */
    appName: string;
    /**
     * Domain verification file
     * To verify groups' domains, users can upload a file to this path
     * By default, it will be staart-verify.txt in the .well-known directory
     */
    domainVerificationFile: string;
  };

  /** Rate limitng */
  rateLimit: {
    /** Rate limit for public (no authentication) */
    public: {
      /**
       * Maximum number of consumable points
       * @default 250
       */
      points: number;
      /**
       * Time in seconds before rate limit is reset
       * @default 3600
       */
      duration: number;
    };
    /** Rate limit for authenticated users */
    authenticated: {
      /**
       * Maximum number of consumable points
       * @default 5000
       */
      points: number;
      /**
       * Time in seconds before rate limit is reset
       * @default 3600
       */
      duration: number;
    };
    /** Rate limit for API key authentication */
    apiKey: {
      /**
       * Maximum number of consumable points
       * @default 10000
       */
      points: number;
      /**
       * Time in seconds before rate limit is reset
       * @default 3600
       */
      duration: number;
    };
  };

  /** Caching */
  caching: {
    /**
     * Least Recently Used (LRU) cache size for geolocation
     * @default 100
     */
    geolocationLruSize: number;
    /**
     * Least Recently Used (LRU) cache size for API key
     * @default 100
     */
    apiKeyLruSize: number;
  };

  security: {
    /**
     * Number of salt rounds when hashing passwords
     * @default 10
     */
    saltRounds: number;
    /**
     * Secret for signing JSON Web Tokens (JWT)
     */
    jwtSecret: string;
    /**
     * Issuer domain for acct: URIs and JWTs
     * For example, acct:12@staart.js.org in access tokens
     * Also used as the "iss" claim in JWTs
     */
    issuerDomain: string;
    /**
     * Window of (number of) past TOTPs allowed
     * @default 1
     */
    totpWindowPast: number;
    /**
     * Window of (number of) future TOTPs allowed
     * @default 0
     */
    totpWindowFuture: number;
    /**
     * MFA tokens expiry time
     * @default 10m
     */
    mfaTokenExpiry: string;
    /**
     * Merge users expiry time
     * @default 30m
     */
    mergeUsersTokenExpiry: string;
    /**
     * Access token expiry time
     * @default 1h
     */
    accessTokenExpiry: string;
    /**
     * Check for pwned passwords
     * @default true
     */
    passwordPwnedCheck: boolean;
    /**
     * Delete unused refresh tokens after these many days
     * @default 30
     */
    unusedRefreshTokenExpiryDays: number;
    /**
     * Delete deactivated users after these many days
     * @default 30
     */
    inactiveUserDeleteDays: number;
  };

  /** ElasticSearch for logging */
  elasticSearch: {
    node: string;
    /**
     * Number of times to retry saving records
     * @default 3
     */
    retries: number;
    auth?: BasicAuth | ApiKeyAuth;
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
  };

  /** Email */
  email: {
    /** Name for email "From" */
    name: string;
    from: string;
    /**
     * Number of times to retry sending failed emails
     * @default 3
     */
    retries: number;
    /** AWS SES */
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

  /** Outgoing webhooks */
  webhooks: {
    /**
     * Number of times to retry triggering webhooks
     * @default 3
     */
    retries: number;
  };

  /** Sending messages */
  sms: {
    /**
     * Number of times to retry sending an SMS
     * @default 3
     */
    retries: number;
    twilioAccountSid: string;
    twilioAuthToken: string;
  };

  /** Stripe payments */
  payments: {
    stripeApiKey: string;
    stripeProductId: string;
    stripeEndpointSecret: string;
    paymentMethodTypes: Array<Stripe.Checkout.SessionCreateParams.PaymentMethodType>;
  };

  /** Server logs */
  tracking: {
    /**
     * Types of server logs to save in ElasticSearch
     * (a) all: Track all incoming requests
     * (b) api-key: Track requests with an API key
     * (c) authenticated: Track requests with a logged in user
     * @default api-key
     */
    mode: 'all' | 'api-key' | 'authenticated';
    index: string;
    /**
     * Whether to delete old ElasticSearch logs
     * @default true
     */
    deleteOldLogs: boolean;
    /**
     * Delete logs older than these many days
     * @default 90
     */
    deleteOldLogsDays: number;
  };

  /** Slack integration */
  slack: {
    token: string;
    slackApiUrl?: string;
    rejectRateLimitedCalls?: boolean;
    retries: number;
  };

  /** Airtable integration */
  airtable: {
    apiKey: string;
    endpointUrl?: string;
  };

  /** AWS S3 integration */
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket?: string;
  };

  /** Cloudinary integration */
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };

  /** Firebase integration */
  firebase: {
    serviceAccountKey:
      | string
      | { projectId?: string; clientEmail?: string; privateKey?: string };
    databaseUrl: string;
  };

  /** Github integration */
  github: {
    auth: string;
    userAgent?: string;
  };

  /** Google Maps integration */
  googleMaps: {
    apiKey: string;
  };
}
