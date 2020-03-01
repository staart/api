import { User } from "../interfaces/tables/user";
import dns from "dns";
import { getOrganizationIdFromUsername } from "../crud/organization";
import { Request, Response } from "express";
import { Tokens } from "../interfaces/enum";
import { ApiKeyResponse } from "./jwt";
import { isMatch } from "@staart/text";
import { getUserIdFromUsername } from "../crud/user";
import { joiValidate, Joi } from "@staart/validate";

/**
 * Delete any sensitive information for a user like passwords and tokens
 */
export const deleteSensitiveInfoUser = (user: User) => {
  delete user.password;
  delete user.twoFactorSecret;
  return user;
};

export const organizationUsernameToId = async (id: string) => {
  if (!id.match(/^-{0,1}\d+$/)) {
    return await getOrganizationIdFromUsername(id);
  } else {
    return parseInt(id).toString();
  }
};

export const userUsernameToId = async (id: string, tokenUserId: string) => {
  if (id === "me") {
    return String(tokenUserId);
  } else if (!id.match(/^-{0,1}\d+$/)) {
    return await getUserIdFromUsername(id);
  } else {
    return parseInt(id).toString();
  }
};

export const localsToTokenOrKey = (res: Response) => {
  if (res.locals.token.sub == Tokens.API_KEY) {
    return res.locals.token as ApiKeyResponse;
  }
  return res.locals.token.id as string;
};

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
export const IdValues = [
  "id",
  "userId",
  "organizationId",
  "primaryEmail",
  "apiKeyId",
  "apiKeyOrganizationId"
];

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
