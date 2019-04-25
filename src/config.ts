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
export const SES_EMAIL = process.env.SES_EMAIL || "";
export const SES_REGION = process.env.SES_REGION || "eu-west-1";
export const SES_ACCESS = process.env.SES_ACCESS || "";
export const SES_SECRET = process.env.SES_SECRET || "";

// Auth and tokens
export const JWT_SECRET = process.env.JWT_SECRET || "staart";
export const JWT_ISSUER = process.env.JWT_ISSUER || "staart";
