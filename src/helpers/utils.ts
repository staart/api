import anonymize from "ip-anonymize";
import { User } from "../interfaces/tables/user";
import Joi from "@hapi/joi";

/**
 * Capitalize each first letter in a string
 */
export const capitalizeEachFirstLetter = (string: string) =>
  (string = string
    .toLowerCase()
    .split(" ")
    .map(s => s.charAt(0).toUpperCase() + s.toLowerCase().substring(1))
    .join(" "));

/**
 * Capitalize the first letter of each word in a string
 */
export const capitalizeFirstAndLastLetter = (string: string) => {
  const words = string.split(" ");
  words[0] = capitalizeFirstLetter(words[0]);
  words[words.length - 1] = capitalizeFirstLetter(words[words.length - 1]);
  return words.join(" ");
};

/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (string: string) =>
  string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);

/**
 * Convert a JS Date to MySQL-compatible datetime
 */
export const dateToDateTime = (date: Date) =>
  date
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

/**
 * Delete any sensitive information for a user like passwords and tokens
 */
export const deleteSensitiveInfoUser = (user: User) => {
  delete user.password;
  delete user.twoFactorSecret;
  return user;
};

/**
 * Anonymize an IP address
 */
export const anonymizeIpAddress = (ipAddress: string) =>
  anonymize(ipAddress) || ipAddress;

/**
 * MySQL columns which are booleans
 */
export const boolValues = [
  "twoFactorEnabled",
  "prefersReducedMotion",
  "prefersColorSchemeDark",
  "used",
  "isVerified"
];

/**
 * MySQL columns which are datetime values
 */
export const dateValues = ["createdAt", "updatedAt"];

/**
 * MySQL columns which are JSON values
 */
export const jsonValues = ["data"];

/**
 * MySQL columns which are read-only
 */
export const readOnlyValues = [
  "createdAt",
  "id",
  "apiKey",
  "secretKey",
  "userId",
  "organizationId"
];

export const joiValidate = (schemaMap: Joi.SchemaMap, data: any) => {
  const schema = Joi.object().keys(schemaMap);
  const result = Joi.validate(data, schema);
  if (result.error) throw new Error(`joi:${JSON.stringify(result.error)}`);
  return true;
};
