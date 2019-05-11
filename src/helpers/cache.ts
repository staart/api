import NodeCache from "node-cache";
import { CACHE_TTL, CACHE_CHECK_PERIOD } from "../config";
import { query } from "./mysql";
import { ErrorCode, CacheCategories } from "../interfaces/enum";

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD
});

const generateKey = (category: CacheCategories, item: number | string) =>
  `${category}_${item}`;

/**
 * Get an item from the cache
 */
export const getItemFromCache = (
  category: CacheCategories,
  item: number | string
) => {
  const key = generateKey(category, item);
  return cache.get(key);
};

/**
 * Store a new item to the cache
 */
export const storeItemInCache = (
  category: CacheCategories,
  item: number | string,
  value: any
) => {
  const key = generateKey(category, item);
  return cache.set(key, value);
};

/**
 * Delete a specific item from the cache
 */
export const deleteItemFromCache = (
  category: CacheCategories,
  item: number | string
) => {
  const key = generateKey(category, item);
  return cache.del(key);
};

/**
 * Return the results of a database query by first checking the cache
 */
export const cachedQuery = async (
  category: CacheCategories,
  item: number | string,
  queryString: string,
  values?: (string | number | boolean | Date | undefined)[]
) => {
  const cachedItem = getItemFromCache(category, item);
  if (cachedItem) return cachedItem;
  const databaseItem = await query(queryString, values);
  if (databaseItem) {
    storeItemInCache(category, item, databaseItem);
    return databaseItem;
  }
  throw new Error(ErrorCode.NOT_FOUND);
};
