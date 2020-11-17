import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { config } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { Configuration } from './configuration.interface';
dotenvExpand(config());

const int = (val: string | undefined, num: number): number =>
  val ? (isNaN(parseInt(val)) ? num : parseInt(val)) : num;
const bool = (val: string | undefined, bool: boolean): boolean =>
  val == null ? bool : val == 'true';

const configuration: Configuration = {
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  meta: {
    appName: process.env.APP_NAME ?? 'Staart',
    domainVerificationFile:
      process.env.DOMAIN_VERIFICATION_FILE ?? 'staart-verify.txt',
  },
  rateLimit: {
    public: {
      points: int(process.env.RATE_LIMIT_PUBLIC_POINTS, 250),
      duration: int(process.env.RATE_LIMIT_PUBLIC_DURATION, 3600),
    },
    authenticated: {
      points: int(process.env.RATE_LIMIT_AUTHENTICATED_POINTS, 5000),
      duration: int(process.env.RATE_LIMIT_AUTHENTICATED_DURATION, 3600),
    },
    apiKey: {
      points: int(process.env.RATE_LIMIT_API_KEY_POINTS, 10000),
      duration: int(process.env.RATE_LIMIT_API_KEY_DURATION, 3600),
    },
  },
  caching: {
    geolocationLruSize: int(process.env.GEOLOCATION_LRU_SIZE, 100),
    apiKeyLruSize: int(process.env.API_KEY_LRU_SIZE, 100),
  },
  security: {
    saltRounds: int(process.env.SALT_ROUNDS, 10),
    jwtSecret: process.env.JWT_SECRET ?? 'staart',
    totpWindowPast: int(process.env.TOTP_WINDOW_PAST, 1),
    totpWindowFuture: int(process.env.TOTP_WINDOW_FUTURE, 0),
    mfaTokenExpiry: process.env.MFA_TOKEN_EXPIRY ?? '10m',
    mergeUsersTokenExpiry: process.env.MERGE_USERS_TOKEN_EXPIRY ?? '30m',
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? '1h',
    passwordPwnedCheck: bool(process.env.PASSWORD_PWNED_CHECK, true),
    unusedRefreshTokenExpiryDays: int(process.env.DELETE_EXPIRED_SESSIONS, 30),
    inactiveUserDeleteDays: int(process.env.INACTIVE_USER_DELETE_DAYS, 30),
  },
  elasticSearch: {
    node: process.env.ELASTICSEARCH_NODE,
    retries: int(process.env.ELASTICSEARCH_FAIL_RETRIES, 3),
    auth: process.env.ELASTICSEARCH_AUTH_USERNAME
      ? {
          username: process.env.ELASTICSEARCH_AUTH_USERNAME,
          password: process.env.ELASTICSEARCH_AUTH_PASSWORD,
        }
      : process.env.ELASTICSEARCH_AUTH_API_KEY
      ? process.env.ELASTICSEARCH_AUTH_API_KEY_ID
        ? {
            apiKey: {
              api_key: process.env.ELASTICSEARCH_AUTH_API_KEY,
              id: process.env.ELASTICSEARCH_AUTH_API_KEY_ID,
            },
          }
        : { apiKey: process.env.ELASTICSEARCH_AUTH_API_KEY }
      : undefined,
    aws: {
      accessKeyId: process.env.ELASTICSEARCH_AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.ELASTICSEARCH_AWS_SECRET_ACCESS_KEY ?? '',
      region: process.env.ELASTICSEARCH_AWS_REGION ?? '',
    },
  },
  email: {
    name: process.env.EMAIL_NAME ?? 'Staart',
    from: process.env.EMAIL_FROM ?? '',
    retries: int(process.env.EMAIL_FAIL_RETRIES, 3),
    ses: {
      accessKeyId: process.env.EMAIL_SES_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.EMAIL_SES_SECRET_ACCESS_KEY ?? '',
      region: process.env.EMAIL_SES_REGION ?? '',
    },
    transport: {
      host: process.env.EMAIL_HOST ?? '',
      port: int(process.env.EMAIL_PORT, 587),
      secure: bool(process.env.EMAIL_SECURE, false),
      auth: {
        user: process.env.EMAIL_USER ?? process.env.EMAIL_FROM ?? '',
        pass: process.env.EMAIL_PASSWORD ?? '',
      },
    },
  },
  webhooks: {
    retries: int(process.env.WEBHOOK_FAIL_RETRIES, 3),
  },
  sms: {
    retries: int(process.env.SMS_FAIL_RETRIES, 3),
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  },
  payments: {
    stripeApiKey: process.env.STRIPE_API_KEY ?? '',
    stripeProductId: process.env.STRIPE_PRODUCT_ID ?? '',
    stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET ?? '',
    paymentMethodTypes: ['card'],
  },
  tracking: {
    mode:
      (process.env.TRACKING_MODE as Configuration['tracking']['mode']) ??
      'api-key',
    index: process.env.TRACKING_INDEX ?? 'staart-logs',
    deleteOldLogs: bool(process.env.TRACKING_DELETE_OLD_LOGS, true),
    deleteOldLogsDays: int(process.env.TRACKING_DELETE_OLD_LOGS_DAYS, 90),
  },
  slack: {
    token: process.env.SLACK_TOKEN ?? '',
    slackApiUrl: process.env.SLACK_API_URL,
    rejectRateLimitedCalls: bool(
      process.env.SLACK_REJECT_RATE_LIMITED_CALLS,
      false,
    ),
    retries: int(process.env.SLACK_FAIL_RETRIES, 3),
  },
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY ?? '',
    endpointUrl: process.env.AIRTABLE_ENDPOINT_URL,
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    region: process.env.S3_REGION ?? '',
    bucket: process.env.S3_BUCKET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  firebase: {
    serviceAccountKey: process.env.FIREBASE_PROJECT_ID
      ? {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
  },
  github: {
    auth: process.env.GITHUB_AUTH,
    userAgent: process.env.GITHUB_USER_AGENT,
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
};

const configFunction: ConfigFactory<Configuration> = () => configuration;
export default configFunction;
