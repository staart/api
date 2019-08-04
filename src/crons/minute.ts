import { CronJob } from "cron";
import {
  getTrackingData,
  clearTrackingData,
  getSecurityEvents,
  clearSecurityEventsData
} from "../helpers/tracking";
import { elasticSearch } from "../helpers/elasticsearch";

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
  for await (const body of data) {
    try {
      await elasticSearch.index({
        index: `staart-events-${year}-${month}-${day}`,
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
        index: `staart-logs-${year}-${month}-${day}`,
        body,
        type: "log"
      });
    } catch (error) {
      console.log("Got error in saving to ElasticSearch", error);
    }
  }
  clearTrackingData();
};
