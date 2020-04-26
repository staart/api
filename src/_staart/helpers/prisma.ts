import { PrismaClient } from "@prisma/client";
import { cleanup } from "@staart/server";
import { complete, success } from "@staart/errors";
import { getConfig } from "@staart/config";

export const prisma = new PrismaClient({
  log:
    getConfig("NODE_ENV") === "production"
      ? ["warn"]
      : ["query", "info", "warn"],
});

cleanup(() => {
  complete("Gracefully exiting Staart API app");
  prisma.disconnect().then(() => success("Disconnected database connection"));
});

export const paginatedResult = <T>(
  data: T,
  { first, last }: { first?: number; last?: number }
) => {
  const dataArray = (data as any) as { id: number }[];
  const hasMore = dataArray.length >= (first || last || Infinity);
  return {
    data,
    hasMore,
    next: hasMore ? dataArray[dataArray.length - 1].id : undefined,
  };
};
