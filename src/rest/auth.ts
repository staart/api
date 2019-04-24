import { User } from "../interfaces/tables/user";
import { createUser } from "../crud/user";

export const register = async (
  user?: User,
  email?: string,
  organizationId?: string
) => {
  const result = await createUser({
    name: "Anand Chowdhary"
  });
  console.log(result);
  return "done!";
};
