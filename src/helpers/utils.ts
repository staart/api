import anonymize from "ip-anonymize";
import { User } from "../interfaces/tables/user";
import dns from "dns";
import Joi from "@hapi/joi";
import { getOrganizationIdFromUsername } from "../crud/organization";
import { Request, Response } from "express";
import slugify from "slugify";
import cryptoRandomString from "crypto-random-string";
import { Tokens } from "../interfaces/enum";
import { ApiKeyResponse } from "./jwt";
import { isMatch } from "matcher";
import Hashids from "hashids/cjs";
import { getUserIdFromUsername } from "../crud/user";
import { HASH_IDS } from "../config";

const hashIds = new Hashids(
  HASH_IDS,
  10,
  "abcdefghijklmnopqrstuvwxyz1234567890"
);

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

export const organizationUsernameToId = async (id: string) => {
  if (isNaN(Number(id))) {
    return await getOrganizationIdFromUsername(id);
  } else {
    return hashIdToId(id);
  }
};

export const userUsernameToId = async (id: string, tokenUserId: string) => {
  if (id === "me") {
    return tokenUserId;
  } else if (isNaN(Number(id))) {
    return await getUserIdFromUsername(id);
  } else {
    return hashIdToId(id);
  }
};

export const generateHashId = (id: string) => `hashid-${hashIds.encode(id)}`;

export const hashIdToId = (id: string | number): string => {
  if (typeof id === "number") return id.toString();
  if (id.startsWith("hashid-")) {
    const numberId = parseInt(
      hashIds.decode(id.replace("hashid-", "")).join("")
    );
    if (isNaN(numberId)) {
      const newId = parseInt(id);
      if (isNaN(newId)) {
        return id;
      } else {
        return newId.toString();
      }
    } else {
      return numberId.toString();
    }
  }
  return id;
};

export const localsToTokenOrKey = (res: Response) => {
  if (res.locals.token.sub == Tokens.API_KEY) {
    return res.locals.token as ApiKeyResponse;
  }
  return res.locals.token.id as string;
};

export const createSlug = (name: string) =>
  `${slugify(name, {
    lower: true
  }).replace(/'|"/g, "")}-${cryptoRandomString({ length: 5 })}`;

export const safeRedirect = (req: Request, res: Response, url: string) => {
  if (req.get("X-Requested-With") === "XMLHttpRequest")
    return res.json({ redirect: url });
  return res.redirect(url);
};

export const getCodeFromRequest = (req: Request) => {
  const code =
    req.body.code || (req.get("Authorization") || "").replace("Bearer ", "");
  joiValidate({ code: Joi.string().required() }, { code });
  return code;
};

/**
 * MySQL columns which are booleans
 */
export const boolValues = [
  "twoFactorEnabled",
  "prefersReducedMotion",
  "prefersColorSchemeDark",
  "used",
  "isVerified",
  "forceTwoFactor",
  "autoJoinDomain",
  "onlyAllowDomain",
  "isActive",
  "checkLocationOnLogin"
];

/**
 * MySQL columns which are datetime values
 */
export const dateValues = [
  "createdAt",
  "updatedAt",
  "lastFiredAt",
  "expiresAt"
];

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
  "jwtApiKey",
  "userId",
  "organizationId"
];

/**
 * MySQL columns which are for int IDs
 */
export const IdValues = ["id", "userId", "organizationId", "primaryEmail"];

export const joiValidate = (schemaMap: Joi.SchemaMap, data: any) => {
  const schema = Joi.object().keys(schemaMap);
  const result = Joi.validate(data, schema);
  if (result.error) throw new Error(`joi:${JSON.stringify(result.error)}`);
  return true;
};

export const removeFalsyValues = (value: any) => {
  if (value && typeof value === "object") {
    Object.keys(value).map(key => {
      if (!value[key]) delete value[key];
    });
  }
  return value;
};

export const includesDomainInCommaList = (commaList: string, value: string) => {
  const list = commaList.split(",").map(item => item.trim());
  let includes = false;
  list.forEach(item => {
    if (item === value || isMatch(value, `*.${item}`)) includes = true;
  });
  return includes;
};

export const dnsResolve = (
  hostname: string,
  recordType:
    | "A"
    | "AAAA"
    | "ANY"
    | "CNAME"
    | "MX"
    | "NAPTR"
    | "NS"
    | "PTR"
    | "SOA"
    | "SRV"
    | "TXT"
): Promise<
  | string[]
  | dns.MxRecord[]
  | dns.NaptrRecord[]
  | dns.SoaRecord
  | dns.SrvRecord[]
  | string[][]
  | dns.AnyRecord[]
> =>
  new Promise((resolve, reject) => {
    dns.resolve(hostname, recordType, (error, records) => {
      if (error) return reject(error);
      resolve(records);
    });
  });
