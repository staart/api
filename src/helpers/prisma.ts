import { PrismaClient } from "@prisma/client";
import { cleanup } from "@staart/server";
import { complete, success } from "@staart/errors";
import { getConfig } from "@staart/config";

export const prisma = new PrismaClient({
  log: getConfig("NODE_ENV") === "production" ? ["warn"] : ["query", "warn"],
});

cleanup(() => {
  complete("Gracefully exiting Staart API app");
  prisma.disconnect().then(() => success("Disconnected database connection"));
});
