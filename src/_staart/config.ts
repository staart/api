/**
 * This is the central configuration file for Staart
 * It is RECOMMENDED that you do not modify this file, but create
 * your own configuration file in `src/` to add custom properties.
 */

import { cosmicSync } from "@anandchowdhary/cosmic";
import {
  BaseScopesUser,
  BaseScopesGroup,
  BaseScopesAdmin,
} from "./helpers/authorization";
cosmicSync("staart");

/**
 * Convert a Check if a boolean value is true (supports strings)
 * @param booleanValue - Value to convert
 */
export const bool = (booleanValue?: string | boolean) =>
  String(booleanValue).toLowerCase() === "true";

// Email
export const ALLOW_DISPOSABLE_EMAILS = bool(process.env.DISPOSABLE_EMAIL);
export const TEST_EMAIL = process.env.TEST_EMAIL || "staart@mailinator.com";
/// If you want to use AWS SES to send emails:
export const SES_EMAIL = process.env.SES_EMAIL || "";
export const SES_REGION = process.env.SES_REGION || "eu-west-1";
export const SES_ACCESS = process.env.SES_ACCESS || "";
export const SES_SECRET = process.env.SES_SECRET || "";
/// If you want to use SMTP to send emails:
export const EMAIL_FROM = process.env.EMAIL_FROM || "";
export const EMAIL_HOST = process.env.EMAIL_HOST || "";
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";

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
export const DISALLOW_OPEN_CORS = bool(process.env.DISALLOW_OPEN_CORS);

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
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID || "";

// Tracking
export const AWS_ELASTIC_ACCESS_KEY = process.env.AWS_ELASTIC_ACCESS_KEY || "";
export const AWS_ELASTIC_SECRET_KEY = process.env.AWS_ELASTIC_SECRET_KEY || "";
export const AWS_ELASTIC_HOST = process.env.AWS_ELASTIC_HOST || "";
export const AWS_ELASTIC_REGION = process.env.AWS_ELASTIC_REGION || "";
export const ELASTIC_HOST = process.env.ELASTIC_HOST || "";
export const ELASTIC_LOG = process.env.ELASTIC_LOG || "";
export const ELASTIC_API_VERSION = process.env.ELASTIC_API_VERSION || "7.2";
export const ELASTIC_LOGS_INDEX =
  process.env.ELASTIC_LOGS_INDEX || "staart-logs";
export const ELASTIC_EVENTS_INDEX =
  process.env.ELASTIC_EVENTS_INDEX || "staart-events";
export const ELASTIC_INSTANCES_INDEX =
  process.env.ELASTIC_INSTANCES_INDEX || "staart-instances";

export const ScopesUser = { ...BaseScopesUser };
export const ScopesGroup = { ...BaseScopesGroup };
export const ScopesAdmin = { ...BaseScopesAdmin };
