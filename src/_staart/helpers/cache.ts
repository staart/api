import { RESOURCE_NOT_FOUND } from "@staart/errors";
import { redis } from "@staart/redis";

/**
 * Get an item from Redis cache
 * @param key - Key
 */
export const getItemFromCache = async <T = {}>(key: string) => {
  const result = await redis.get(key);
  if (result) return JSON.parse(result) as T;
  throw new Error(RESOURCE_NOT_FOUND);
};

/**
 * Delete items from Redis cache
 * @param keys - Keys to delete
 */
export const deleteItemFromCache = async (...keys: string[]) => {
  return redis.del(...keys);
};

/**
 * Set a new item in Redis cache
 * @param key - Item key
 * @param value - Item value object
 * @param expiry - Expiry time (defaults to 10 mins)
 */
export const setItemInCache = async (
  key: string,
  value: any,
  expiry?: Date
) => {
  await redis.set(key, JSON.stringify(value), [
    "EX",
    expiry ? Math.floor((expiry.getTime() - new Date().getTime()) / 1000) : 600,
  ]);
};
