import { error } from "@staart/errors";
import { CronJob } from "cron";
import {
  elasticSearchIndex,
  receiveElasticSearchMessage,
} from "../_staart/helpers/elasticsearch";
import { receiveEmailMessage } from "../_staart/helpers/mail";
import {
  clearSecurityEventsData,
  clearTrackingData,
  getSecurityEvents,
  getTrackingData,
} from "../_staart/helpers/tracking";
import { IdValues } from "../_staart/helpers/utils";
import { receiveWebhookMessage } from "../_staart/helpers/webhooks";
import { config } from "@anandchowdhary/cosmic";

const ELASTIC_EVENTS_INDEX = config("elasticEventsIndex");
const ELASTIC_LOGS_INDEX = config("elasticLogsIndex");

/**
 * We run this cron job every minute in production
 * but every 10 seconds in development
 */
export default () => {
  new CronJob(
    config("nodeEnv") === "production"
      ? "* * * * *"
      : config("devCronMinute") ?? "*/10 * * * * *",
    async () => {
      await receiveEmailMessage();
      await receiveElasticSearchMessage();
      await receiveWebhookMessage();
      await storeTrackingLogs();
      await storeSecurityEvents();
    },
    undefined,
    true
  );
};

const storeSecurityEvents = async () => {
  if (!config("trackAuditLogData")) return;
  const data = getSecurityEvents();
  if (!data.length) return;
  for await (const body of data) {
    if (typeof body === "object") {
      Object.keys(body).forEach((key) => {
        if (IdValues.includes(key)) body[key] = body[key];
      });
      if (body.data && typeof body.data === "object") {
        Object.keys(body.data).forEach((key) => {
          if (IdValues.includes(key)) body.data[key] = body.data[key];
        });
      }
    }
    try {
      await elasticSearchIndex({
        index: ELASTIC_EVENTS_INDEX,
        body,
      });
    } catch (err) {
      error("Got error in saving to ElasticSearch", JSON.stringify(err));
    }
  }
  clearSecurityEventsData();
};

const storeTrackingLogs = async () => {
  if (!config("trackRequestData")) return;
  const data = getTrackingData();
  if (!data.length) return;
  for await (const body of data) {
    try {
      if (typeof body === "object") {
        Object.keys(body).forEach((key) => {
          if (IdValues.includes(key)) body[key] = body[key];
        });
        if (body.data && typeof body.data === "object") {
          Object.keys(body.data).forEach((key) => {
            if (IdValues.includes(key)) body.data[key] = body.data[key];
          });
        }
      }
      await elasticSearchIndex({
        index: ELASTIC_LOGS_INDEX,
        body,
      });
    } catch (err) {
      error("Got error in saving to ElasticSearch", JSON.stringify(err));
    }
  }
  clearTrackingData();
};
