import { getConnectionManager } from "typeorm";
import {
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE
} from "../config";

const connectionManager = getConnectionManager();
const connection = connectionManager.create({
  type: "mysql",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE
});

export const connect = async () => {
  return await connection.connect();
};
