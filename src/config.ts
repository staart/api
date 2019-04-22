import { config } from "dotenv";
config();

// Database
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT
  ? parseInt(process.env.DB_PORT)
  : 3306;
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_DATABASE = process.env.DB_DATABASE || "database";
