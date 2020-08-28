import { PrismaClient } from "@prisma/client";
import { getConfig } from "@staart/config";
import { complete, success } from "@staart/errors";
import { sign, verify } from "twt";
import { cleanup } from "@staart/server";
import { config } from "@anandchowdhary/cosmic";

export const prisma = new PrismaClient({
  log: getConfig("NODE_ENV") === "production" ? ["warn"] : ["info", "warn"],
});

const decodeTwtId = (object: any) => {
  if (typeof object === "object" && !Array.isArray(object)) {
    Object.keys(object).forEach((key: any) => {
      if (
        typeof object[key] === "string" &&
        ((typeof key === "string" && key === "id") || key.endsWith("Id"))
      ) {
        object[key] = parseInt(
          verify(object[key], config("twtSecret"), 10),
          10
        );
      } else if (
        typeof object[key] === "object" &&
        !Array.isArray(object[key])
      ) {
        object[key] = decodeTwtId(object[key]);
      } else if (Array.isArray(object[key])) {
        object[key] = object[key].map((value: any) => decodeTwtId(value));
      }
    });
  } else if (Array.isArray(object)) {
    object = object.map((value: any) => decodeTwtId(value));
  }
  return object;
};

prisma.$use(async (params, next) => {
  // Decode TWT
  if (typeof params.args === "object") params.args = decodeTwtId(params.args);

  const result = await next(params);

  // Use TWT IDs for objects
  if (typeof result === "object" && !Array.isArray(result))
    Object.keys(result).forEach((key) => {
      if (
        (key === "id" || key.endsWith("Id")) &&
        typeof result[key] === "number"
      )
        result[key] = sign(String(result[key]), config("twtSecret"), 10);
    });

  // Use TWT IDs for arrays of objects
  if (Array.isArray(result))
    result.map((result) => {
      Object.keys(result).forEach((key) => {
        if (
          (key === "id" || key.endsWith("Id")) &&
          typeof result[key] === "number"
        )
          result[key] = sign(String(result[key]), config("twtSecret"), 10);
      });
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

export const paginatedResult = <T>(data: T, { take }: { take?: number }) => {
  const dataArray = (data as any) as { id: number }[];
  const hasMore = dataArray.length >= (take || Infinity);
  return {
    data,
    hasMore,
    next: hasMore ? dataArray[dataArray.length - 1].id : undefined,
  };
};
