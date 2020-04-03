import { PrismaClient } from "@prisma/client";
import { cleanup } from "@staart/server";
import { complete, success } from "@staart/errors";

export const prisma = new PrismaClient();

cleanup(() => {
  complete("Gracefully exiting Staart API app");
  prisma.disconnect().then(() => success("Disconnected database connection"));
});
