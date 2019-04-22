import { connect } from "../helpers/database";
import { User } from "../entities/user";

export const create = async (user: User) => {
  const connection = await connect();
  await connection
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(user)
    .execute();
  connection.close();
};
