import { config } from "@anandchowdhary/cosmic";
import { users } from "@prisma/client";
import { Request, Response } from "@staart/server";
import { isMatch } from "@staart/text";
import { Joi, joiValidate } from "@staart/validate";
import dns from "dns";
import { verify } from "twt";
import { Tokens } from "../interfaces/enum";
import { ApiKeyResponse } from "./jwt";

/**
 * Make s single property optional
 * @source https://stackoverflow.com/a/54178819/1656944
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const twtToId = (twt: string, userId?: string) =>
  twt === "me" && userId
    ? parseInt(verify(userId, config("twtSecret"), 10), 10)
    : parseInt(verify(twt, config("twtSecret"), 10), 10);

/**
 * Delete any sensitive information for a user like passwords and tokens
 */
export const deleteSensitiveInfoUser = (_user: users) => {
  const user: PartialBy<PartialBy<users, "password">, "twoFactorSecret"> = {
    ..._user,
  };
  delete user.password;
  delete user.twoFactorSecret;
  return user as users;
};

export const localsToTokenOrKey = (res: Response) => {
  if (res.locals.token.sub == Tokens.API_KEY) {
    return res.locals.token as ApiKeyResponse;
  }
  return twtToId(res.locals.token.id) as number;
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
  "checkLocationOnLogin",
];

/**
 * MySQL columns which are datetime values
 */
export const dateValues = [
  "createdAt",
  "updatedAt",
  "lastFiredAt",
  "expiresAt",
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
  "groupId",
];

/**
 * MySQL columns which are for int IDs
 */
export const IdValues = [
  "id",
  "userId",
  "groupId",
  "primaryEmail",
  "apiKeyId",
  "apiKeyGroupId",
];

export const removeFalsyValues = (value: any) => {
  if (value && typeof value === "object") {
    Object.keys(value).map((key) => {
      if (!value[key]) delete value[key];
    });
  }
  return value;
};

export const includesDomainInCommaList = (commaList: string, value: string) => {
  const list = commaList.split(",").map((item) => item.trim());
  let includes = false;
  list.forEach((item) => {
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
  | Array<string>
  | Array<dns.MxRecord>
  | Array<dns.NaptrRecord>
  | dns.SoaRecord
  | Array<dns.SrvRecord>
  | Array<Array<string>>
  | Array<dns.AnyRecord>
> =>
  new Promise((resolve, reject) => {
    dns.resolve(hostname, recordType, (error, records) => {
      if (error) return reject(error);
      resolve(records);
    });
  });

export const queryToParams = (req: Request) => {
  if (typeof req.query === "object") {
    const query: { [index: string]: string | string[] } = req.query as any;
    const result: {
      [index: string]: number | { [index: string]: string | boolean };
    } = {};
    if (typeof query.skip === "string") result.skip = parseInt(query.skip);
    if (typeof query.take === "string") result.take = parseInt(query.take);

    query.select = query.select || [];
    if (typeof query.select === "string") query.select = [query.select];
    const select: { [index: string]: boolean } = {};
    query.select.forEach((selectQuery) => (select[selectQuery] = true));
    if (Object.keys(select).length) result.select = select;

    query.include = query.include || [];
    if (typeof query.include === "string") query.include = [query.include];
    const include: { [index: string]: boolean } = {};
    query.include.forEach((includeQuery) => (include[includeQuery] = true));
    if (Object.keys(include).length) result.include = include;

    query.orderBy = query.orderBy || [];
    if (typeof query.orderBy === "string") query.orderBy = [query.orderBy];
    const orderBy: { [index: string]: string } = {};
    query.orderBy.forEach((orderByQuery) => {
      if (orderByQuery.trim() && orderByQuery.includes(":")) {
        const orderByArg = orderByQuery.split(":")[1];
        if (["asc", "desc"].includes(orderByArg))
          orderBy[orderByQuery.split(":")[0]] = orderByArg;
      }
    });
    if (Object.keys(orderBy).length) result.orderBy = orderBy;

    console.log(JSON.stringify(query), JSON.stringify(result));
    return result;
  }
  return {};
};
