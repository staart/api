import { createHandyClient } from "handy-redis";
import { REDIS_URL } from "../config";
import { logError } from "./errors";

export const redis = createHandyClient({
  url: REDIS_URL,
  retry_strategy: options => {
    if (options.error && options.error.code === "ECONNREFUSED") {
      logError("Redis connection failed", "Server refused the connection");
    }

    if (options.total_retry_time > 1000 * 60 * 60) {
      logError("Redis connection failed", "Total retry time exhausted");
    }

    if (options.attempt > 10) {
      logError("Redis connection failed", "Max number of attempts exceeded");
      return 43200;
    }

    // Reconnect after this time
    return Math.min(options.attempt * 100, 3000);
  }
});
