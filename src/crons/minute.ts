import { CronJob } from "cron";
import {
  getTrackingData,
  clearTrackingData,
  getSecurityEvents,
  clearSecurityEventsData
} from "../helpers/tracking";
import { elasticSearch } from "../helpers/elasticsearch";
import { IdValues, hashIdToId } from "../helpers/utils";
import { ELASTIC_EVENTS_PREFIX, ELASTIC_LOGS_PREFIX } from "../config";

export default () => {
  new CronJob(
    "* * * * *",
    async () => {
      await storeTrackingLogs();
      await storeSecurityEvents();
    },
    undefined,
    true
  );
};

const storeSecurityEvents = async () => {
  const data = getSecurityEvents();
  if (!data.length) return;
  const date = new Date();
  const year = date.getUTCFullYear();
  let month = (date.getUTCMonth() + 1).toString();
  month = parseInt(month) < 10 ? `0${month}` : month;
  let day = (date.getUTCDate() + 1).toString();
  day = parseInt(day) < 10 ? `0${day}` : day;
  for await (let body of data) {
    if (typeof body === "object") {
      Object.keys(body).forEach(key => {
        if (IdValues.includes(key)) body[key] = hashIdToId(body[key]);
      });
      if (body.data && typeof body.data === "object") {
        Object.keys(body.data).forEach(key => {
          if (IdValues.includes(key))
            body.data[key] = hashIdToId(body.data[key]);
        });
      }
    }
    try {
      await elasticSearch.index({
        index: `${ELASTIC_EVENTS_PREFIX}${year}-${month}-${day}`,
        body,
        type: "log"
      });
    } catch (error) {
      console.log("Got error in saving to ElasticSearch", error);
    }
  }
  clearSecurityEventsData();
};

const storeTrackingLogs = async () => {
  const data = getTrackingData();
  if (!data.length) return;
  const date = new Date();
  const year = date.getUTCFullYear();
  let month = (date.getUTCMonth() + 1).toString();
  month = parseInt(month) < 10 ? `0${month}` : month;
  let day = (date.getUTCDate() + 1).toString();
  day = parseInt(day) < 10 ? `0${day}` : day;
  for await (const body of data) {
    try {
      await elasticSearch.index({
        index: `${ELASTIC_LOGS_PREFIX}${year}-${month}-${day}`,
        body,
        type: "log"
      });
    } catch (error) {
      console.log("Got error in saving to ElasticSearch", error);
    }
  }
  clearTrackingData();
};
