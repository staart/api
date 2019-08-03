import { CronJob } from "cron";
import { getTrackingData, clearTrackingData } from "../helpers/tracking";
import connectionClass from "http-aws-es";
import AWS from "aws-sdk";
import { Client } from "elasticsearch";
import {
  AWS_ELASTIC_ACCESS_KEY,
  AWS_ELASTIC_SECRET_KEY,
  AWS_ELASTIC_HOST
} from "../config";

AWS.config.update({
  credentials: new AWS.Credentials(
    AWS_ELASTIC_ACCESS_KEY,
    AWS_ELASTIC_SECRET_KEY
  ),
  region: "eu-west-3"
});
const client = new Client({
  host: AWS_ELASTIC_HOST,
  connectionClass
});

export default () => {
  new CronJob(
    "* * * * *",
    async () => {
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
          await client.index({
            index: `staart-logs-${year}-${month}-${day}`,
            body,
            type: "log"
          });
        } catch (error) {
          console.log("Got error in saving to ElasticSearch", error);
        }
      }
      clearTrackingData();
    },
    undefined,
    true
  );
};
