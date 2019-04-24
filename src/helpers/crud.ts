import { query } from "./mysql";
import { User } from "../interfaces/tables/user";

export const listAllUsers = async () => {
  return <User[]>await query("SELECT * from users");
};
