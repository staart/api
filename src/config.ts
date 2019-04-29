import { config } from "dotenv";
config();

// Server
export const PORT = process.env.PORT || 7007;

// Database
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT
  ? parseInt(process.env.DB_PORT)
  : 3306;
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_DATABASE = process.env.DB_DATABASE || "database";

// Email
export const FRONTEND_URL = process.env.FRONTEND_URL || "https://example.com";
export const SES_EMAIL = process.env.SES_EMAIL || "";
export const SES_REGION = process.env.SES_REGION || "eu-west-1";
export const SES_ACCESS = process.env.SES_ACCESS || "";
export const SES_SECRET = process.env.SES_SECRET || "";

// Auth and tokens
export const JWT_SECRET = process.env.JWT_SECRET || "staart";
export const JWT_ISSUER = process.env.JWT_ISSUER || "staart";
export const TOKEN_EXPIRY_EMAIL_VERIFICATION =
  process.env.TOKEN_EXPIRY_EMAIL_VERIFICATION || "7d";
export const TOKEN_EXPIRY_PASSWORD_RESET =
  process.env.TOKEN_EXPIRY_PASSWORD_RESET || "1d";
export const TOKEN_EXPIRY_LOGIN = process.env.TOKEN_EXPIRY_LOGIN || "1d";
export const TOKEN_EXPIRY_REFRESH = process.env.TOKEN_EXPIRY_REFRESH || "30d";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GOOGLE_CLIENT_REDIRECT = process.env.GOOGLE_CLIENT_REDIRECT || "";
