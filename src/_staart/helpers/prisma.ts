import { PrismaClient } from "@prisma/client";
import { getConfig } from "@staart/config";
import { complete, success } from "@staart/errors";
import { sign } from "twt";
import { cleanup } from "@staart/server";
import { config } from "@anandchowdhary/cosmic";

export const prisma = new PrismaClient({
  log: getConfig("NODE_ENV") === "production" ? ["warn"] : ["info", "warn"],
});
prisma.$use(async (params, next) => {
  const result = await next(params);
  console.log("Got result", result);
  console.log("Secret it", config("twtSecret"));
  if (typeof result === "object" && !Array.isArray(result))
    if (typeof result.id === "number")
      result.id = sign(String(result.id), config("twtSecret"));
  if (Array.isArray(result))
    result.map((result) => {
      if (typeof result.id === "number")
        result.id = sign(String(result.id), config("twtSecret"));
      return result;
    });
  return result;
});

cleanup(() => {
  complete("Gracefully exiting Staart API app");
  prisma.disconnect().then(() => success("Disconnected database connection"));
});

export const queryParamsToSelect = (queryParams: any) => {
  const data: any = {};

  ["first", "last", "skip"].forEach((i: string) => {
    if (
      typeof queryParams[i] === "string" &&
      !isNaN(parseInt(queryParams[i]))
    ) {
      data[i] = parseInt(queryParams[i]);
    }
  });

  ["before", "after"].forEach((i: string) => {
    if (
      typeof queryParams[i] === "string" &&
      !isNaN(parseInt(queryParams[i]))
    ) {
      data[i] = {
        id: parseInt(queryParams[i]),
      };
    }
  });

  ["select", "include"].forEach((i: string) => {
    if (typeof queryParams[i] === "string") {
      queryParams[i]
        .split(",")
        .map((j: string) => j.trim())
        .forEach((j: string) => {
          data[i] = data[i] || {};
          data[i][j] = true;
        });
    }
  });

  const orderBy = queryParams.orderBy;
  if (typeof orderBy === "string") {
    const orders = orderBy.split(",").map((i: string) => i.trim());
    orders.forEach((order) => {
      data.orderBy = data.orderBy || {};
      data.orderBy[order.split(":")[0]] =
        order.includes(":") && order.split(":")[1] === "desc" ? "desc" : "asc";
    });
  }

  return data;
};

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
