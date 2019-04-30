import NodeCache from "node-cache";
import { CACHE_TTL, CACHE_CHECK_PERIOD } from "../config";
import { query } from "./mysql";
import { ErrorCode } from "../interfaces/enum";

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD
});

const generateKey = (category: string, item: number | string) =>
  `${category}_${item}`;

export const getItemFromCache = (category: string, item: number | string) => {
  const key = generateKey(category, item);
  return cache.get(key);
};

export const storeItemInCache = (
  category: string,
  item: number | string,
  value: any
) => {
  const key = generateKey(category, item);
  return cache.set(key, value);
};

export const deleteItemFromCache = (
  category: string,
  item: number | string
) => {
  const key = generateKey(category, item);
  return cache.del(key);
};

export const cachedQuery = async (
  category: string,
  item: number | string,
  queryString: string,
  values?: (string | number | boolean | Date | undefined)[]
) => {
  const cachedItem = getItemFromCache(category, item);
  if (cachedItem) {
    console.log("Returned from cache");
    return cachedItem;
  }
  const databaseItem = await query(queryString, values);
  if (databaseItem) {
    console.log("Returned from database");
    storeItemInCache(category, item, databaseItem);
    return databaseItem;
  }
  throw new Error(ErrorCode.NOT_FOUND);
};
