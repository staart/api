import { create } from "../queries/crud";

export const register = async () => {
  await create("user", {
    name: "Anand Chowdhary",
    nickname: "Anand"
  });
};
