import { createPool } from "mysql";
import {
  DB_HOST,
  DB_USERNAME,
  DB_PORT,
  DB_PASSWORD,
  DB_DATABASE,
  DB_TABLE_PREFIX
} from "../config";
import { User, BackupCode } from "../interfaces/tables/user";
import { Email } from "../interfaces/tables/emails";
import { Membership } from "../interfaces/tables/memberships";
import { Organization } from "../interfaces/tables/organization";
import { Event } from "../interfaces/tables/events";
import { KeyValue } from "../interfaces/general";
import { boolValues, jsonValues, dateValues, readOnlyValues } from "./utils";
import { getUserPrimaryEmailObject } from "../crud/email";
import { InsertResult } from "../interfaces/mysql";
import { emojify, unemojify } from "node-emoji";

export const pool = createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE
});

/**
 * Return the results of a MySQL query
 */
export const query = (
  queryString: string,
  values?: (string | number | boolean | Date | undefined)[]
): InsertResult | any =>
  new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) return reject(error);
      if (values) values = cleanValues(values);
      connection.query(queryString, values, (error, result) => {
        connection.destroy();
        if (error) return reject(error);
        resolve(uncleanValues(result));
      });
    });
  });

/**
 * Convert an object to MySQL-style (column) VALUES (values)
 */
export const tableValues = (
  object: User | BackupCode | Event | Email | Membership | Organization
) => {
  const values = Object.keys(object)
    .map(() => "?")
    .join(", ");
  const query = `(${Object.keys(object).join(", ")}) VALUES (${values})`;
  return query;
};

/**
 * Convert MySQL output to stronger types, like binary to boolean and datetime to JS Date
 */
export const uncleanValues = (
  data: (User | BackupCode | Event | Email | Membership | Organization)[]
) => {
  if (typeof data.map === "function") {
    data.map((item: KeyValue) => {
      Object.keys(item).forEach(key => {
        try {
          if (jsonValues.includes(key)) item[key] = JSON.parse(item[key]);
        } catch (error) {
          item[key] = {};
        }
        if (boolValues.includes(key)) item[key] = !!item[key];
        if (dateValues.includes(key)) {
          const date = item[key] as Date;
          item[key] = new Date(
            Date.UTC(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              date.getHours(),
              date.getMinutes(),
              date.getSeconds()
            )
          ).toISOString();
        }
        item[key] = emojify(item[key]);
      });
      return item;
    });
  }
  return data;
};

/**
 * Convert object values to MySQL-compatible types
 */
export const cleanValues = (
  values: (string | number | boolean | Date | undefined)[]
) => {
  values = values.map(value => {
    // Clean up strings
    if (typeof value === "string") {
      value = unemojify(value.trim());
    }
    // Convert true to 1, false to 0
    if (typeof value === "boolean") value = value ? 1 : 0;
    // Convert Date to mysql datetime
    if (
      value &&
      typeof value === "object" &&
      typeof value.getMonth === "function"
    )
      value = value
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    return value;
  });
  return values;
};

/**
 * Replace any object values with question marks to prevent injection
 */
export const setValues = (object: KeyValue) => {
  let query = "";
  Object.keys(object).forEach(key => {
    query += `${key} = ?, `;
  });
  return query.slice(0, -2);
};

/**
 * Remove any read-only values like createdAt from an object
 */
export const removeReadOnlyValues = (object: KeyValue) => {
  readOnlyValues.forEach(value => {
    if (object[value]) delete object[value];
  });
  return object;
};

export const addIsPrimaryToEmails = async (emails: Email[]) => {
  try {
    const userPrimaryEmailObject = await getUserPrimaryEmailObject(
      emails[0].userId
    );
    emails.map(email => {
      email.isPrimary = email.id === userPrimaryEmailObject.id;
      return email;
    });
  } catch (error) {}
  return emails;
};

export const addIsPrimaryToEmail = async (email: Email) => {
  try {
    const userPrimaryEmailObject = await getUserPrimaryEmailObject(
      email.userId
    );
    email.isPrimary = email.id === userPrimaryEmailObject.id;
    return email;
  } catch (error) {
    return email;
  }
};

export const tableName = (name: string) => `\`${DB_TABLE_PREFIX}${name}\``;
