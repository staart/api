import { config } from "dotenv";
config();

// Server
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 80;
export const BASE_URL = process.env.BASE_URL || "";
export const SENTRY_DSN = process.env.SENTRY_DSN || "";

// Rate limiting
export const BRUTE_FREE_RETRIES = process.env.BRUTE_FREE_RETRIES
  ? parseInt(process.env.BRUTE_FREE_RETRIES)
  : 100;
export const BRUTE_LIFETIME = process.env.BRUTE_LIFETIME
  ? parseInt(process.env.BRUTE_LIFETIME)
  : 300000;
export const RATE_LIMIT_TIME = process.env.RATE_LIMIT_TIME
  ? parseInt(process.env.RATE_LIMIT_TIME)
  : 60000; // 1 minute
export const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX
  ? parseInt(process.env.RATE_LIMIT_MAX)
  : 1000; // Max 1,000 requests/minute from an IP
export const PUBLIC_RATE_LIMIT_TIME = process.env.PUBLIC_RATE_LIMIT_TIME
  ? parseInt(process.env.PUBLIC_RATE_LIMIT_TIME)
  : 60000; // 1 minute
export const PUBLIC_RATE_LIMIT_MAX = process.env.PUBLIC_RATE_LIMIT_MAX
  ? parseInt(process.env.PUBLIC_RATE_LIMIT_MAX)
  : 60; // Max 60 requests/minute from an IP
export const SPEED_LIMIT_TIME = process.env.SPEED_LIMIT_TIME
  ? parseInt(process.env.SPEED_LIMIT_TIME)
  : 600000; // 10 minutes
export const SPEED_LIMIT_DELAY = process.env.SPEED_LIMIT_DELAY
  ? parseInt(process.env.SPEED_LIMIT_DELAY)
  : 100; // 100ms per request delay
export const SPEED_LIMIT_COUNT = process.env.SPEED_LIMIT_COUNT
  ? parseInt(process.env.SPEED_LIMIT_COUNT)
  : 1000; // Start delaying after 1000 requests

// Database
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT
  ? parseInt(process.env.DB_PORT)
  : 3306;
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_DATABASE = process.env.DB_DATABASE || "database";
export const DB_TABLE_PREFIX = process.env.DB_TABLE_PREFIX || "";
// [redis:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Caching
export const CACHE_TTL = process.env.CACHE_TTL
  ? parseInt(process.env.CACHE_TTL)
  : 600;
export const CACHE_CHECK_PERIOD = process.env.CACHE_CHECK_PERIOD
  ? parseInt(process.env.CACHE_CHECK_PERIOD)
  : 1000;

// Email
export const FRONTEND_URL = process.env.FRONTEND_URL || "https://example.com";
export const SES_EMAIL = process.env.SES_EMAIL || "";
export const SES_REGION = process.env.SES_REGION || "eu-west-1";
export const SES_ACCESS = process.env.SES_ACCESS || "";
export const SES_SECRET = process.env.SES_SECRET || "";
export const ALLOW_DISPOSABLE_EMAILS = !!process.env.DISPOSABLE_EMAIL;
export const TEST_EMAIL = process.env.TEST_EMAIL || "staart@mailinator.com";

// Auth and tokens
export const JWT_SECRET = process.env.JWT_SECRET || "staart";
export const JWT_ISSUER = process.env.JWT_ISSUER || "staart";
export const SERVICE_2FA = process.env.SERVICE_2FA || "staart";
export const HASH_IDS = process.env.HASH_IDS || "staart";
export const HASH_ID_PREFIX = process.env.HASH_ID_PREFIX || "d0e8a7c-";

export const TOKEN_EXPIRY_EMAIL_VERIFICATION =
  process.env.TOKEN_EXPIRY_EMAIL_VERIFICATION || "7d";
export const TOKEN_EXPIRY_PASSWORD_RESET =
  process.env.TOKEN_EXPIRY_PASSWORD_RESET || "1d";
export const TOKEN_EXPIRY_LOGIN = process.env.TOKEN_EXPIRY_LOGIN || "15m";
export const TOKEN_EXPIRY_APPROVE_LOCATION =
  process.env.TOKEN_EXPIRY_APPROVE_LOCATION || "10m";
export const TOKEN_EXPIRY_REFRESH = process.env.TOKEN_EXPIRY_REFRESH || "30d";
export const TOKEN_EXPIRY_API_KEY_MAX = process.env.TOKEN_EXPIRY_API_KEY_MAX
  ? parseInt(process.env.TOKEN_EXPIRY_API_KEY_MAX)
  : 10413685800000; // 2299-12-31 is the default maximum expiry (also what Microsoft uses)
export const DISALLOW_OPEN_CORS = !!process.env.DISALLOW_OPEN_CORS;

// OAuth2 credentials
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "";
export const MICROSOFT_CLIENT_SECRET =
  process.env.MICROSOFT_CLIENT_SECRET || "";
export const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID || "";
export const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET || "";
export const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID || "";
export const SALESFORCE_CLIENT_SECRET =
  process.env.SALESFORCE_CLIENT_SECRET || "";

// Payments and billing
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID || "";

// Tracking
export const AWS_ELASTIC_ACCESS_KEY = process.env.AWS_ELASTIC_ACCESS_KEY || "";
export const AWS_ELASTIC_SECRET_KEY = process.env.AWS_ELASTIC_SECRET_KEY || "";
export const AWS_ELASTIC_HOST = process.env.AWS_ELASTIC_HOST || "";
export const AWS_ELASTIC_REGION = process.env.AWS_ELASTIC_REGION || "";
export const ELASTIC_LOGS_PREFIX =
  process.env.ELASTIC_LOGS_PREFIX || "staart-logs-";
export const ELASTIC_EVENTS_PREFIX =
  process.env.ELASTIC_EVENTS_PREFIX || "staart-events-";
export const ELASTIC_INSTANCES_INDEX =
  process.env.ELASTIC_INSTANCES_INDEX || "staart-instances";
