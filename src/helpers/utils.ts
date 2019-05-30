import anonymize from "ip-anonymize";
import { User } from "../interfaces/tables/user";
import { isEmail, isURL, isMobilePhone } from "validator";
import { ValidationTypes, ErrorCode } from "../interfaces/enum";
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
export const readOnlyValues = ["createdAt", "id", "apiKey", "secretKey"];

/**
 * Validate strings to type
 */
export const validate = (
  text: string,
  type: ValidationTypes,
  maxLength?: number
) => {
  if (type === ValidationTypes.EMAIL)
    if (!isEmail(text)) throw new Error(ErrorCode.VALIDATION_EMAIL);

  if (type === ValidationTypes.URL)
    if (!isURL(text)) throw new Error(ErrorCode.VALIDATION_URL);

  if (type === ValidationTypes.PHONE)
    if (!isMobilePhone(text, "any"))
      throw new Error(ErrorCode.VALIDATION_PHONE);

  if (type === ValidationTypes.TEXT)
    if (!text || !text.trim()) throw new Error(ErrorCode.VALIDATION_TEXT);

  if (maxLength && type === ValidationTypes.TEXT)
    if (text.length > maxLength)
      throw new Error(ErrorCode.VALIDATION_TEXT_LENGTH);

  if (type === ValidationTypes.DOMAIN)
    if (!text || !text.includes("."))
      throw new Error(ErrorCode.VALIDATION_DOMAIN);

  if (type === ValidationTypes.COUNTRY_CODE)
    if (!text || text.length !== 2)
      throw new Error(ErrorCode.VALIDATION_COUNTRY_CODE);

  if (type === ValidationTypes.GENDER)
    if (!text || text.length !== 1)
      throw new Error(ErrorCode.VALIDATION_GENDER);

  if (type === ValidationTypes.LANGUAGE)
    if (!text || !text.trim()) throw new Error(ErrorCode.VALIDATION_LANGUAGE);

  if (type === ValidationTypes.TIMEZONE)
    if (!text || !text.trim()) throw new Error(ErrorCode.VALIDATION_TIMEZONE);
};

export const joiValidate = (schemaMap: Joi.SchemaMap, data: any) => {
  const schema = Joi.object().keys(schemaMap);
  const result = Joi.validate(data, schema);
  if (result.error) throw new Error(`joi:${JSON.stringify(result.error)}`);
  return true;
};
