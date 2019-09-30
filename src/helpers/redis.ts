import { createHandyClient } from "handy-redis";
import { REDIS_URL } from "../config";

export const redis = createHandyClient({
  url: REDIS_URL
});
