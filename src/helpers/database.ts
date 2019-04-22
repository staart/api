import { createConnection } from "typeorm";
import {
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE
} from "../config";

export const connect = async () => {
  return await createConnection({
    type: "mysql",
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    entities: [`${__dirname}/enities/*.ts`],
    synchronize: true
  });
};
