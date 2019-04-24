import { createPool } from "mysql";
import {
  DB_HOST,
  DB_USERNAME,
  DB_PORT,
  DB_PASSWORD,
  DB_DATABASE
} from "../config";
import { User } from "../interfaces/tables/user";
import { BackupCode } from "../interfaces/tables/backup-codes";
import { Email } from "../interfaces/tables/emails";
import { Membership } from "../interfaces/tables/memberships";
import { Organization } from "../interfaces/tables/organization";

export const pool = createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE
});

export const query = (
  queryString: string,
  values?: (string | number | boolean | Date | undefined)[]
) =>
  new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) return reject(error);
      if (values) values = cleanValues(values);
      connection.query(queryString, values, (error, result) => {
        connection.destroy();
        if (error) return reject(error);
        resolve(result);
      });
    });
  });

export const tableValues = (
  object: User | BackupCode | Email | Membership | Organization
) => {
  const values = Object.keys(object)
    .map(() => "?")
    .join(", ");
  const query = `(${Object.keys(object).join(", ")}) VALUES (${values})`;
  return query;
};

export const cleanValues = (
  values: (string | number | boolean | Date | undefined)[]
) => {
  values = values.map(value => {
    // Convert true to 1, false to 0
    if (typeof value === "boolean") value = !!value;
    // Convert Date to mysql datetime
    if (typeof value === "object" && typeof value.getMonth === "function")
      value = value
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    return value;
  });
  return values;
};
