import { TEST_EMAIL, ELASTIC_INSTANCES_INDEX } from "./config";
import { logError, success } from "@staart/errors";
import { sendMail, setupTransporter } from "@staart/mail";
import systemInfo from "systeminformation";
import pkg from "../package.json";
import redis from "@staart/redis";
import { query } from "./helpers/mysql";
import { receiveEmailMessage } from "./helpers/mail";
import { elasticSearchIndex } from "./helpers/elasticsearch";

redis
  .set(pkg.name, systemInfo.time().current)
  .then(() => redis.del(pkg.name))
  .then(() => success("Redis is working"))
  .catch(() => logError("Redis", "Unable to connect"));

receiveEmailMessage()
  .then(() => success("Redis message queue is working"))
  .catch(e => console.log(e, "Redis queue", "Unable to receive message"));

query("SHOW tables")
  .then(() => success("Database connection is working"))
  .catch(() => logError("Database", "Unable to run query `SHOW tables`"));

setupTransporter();
if (process.env.NODE_ENV === "production")
  sendMail({
    to: TEST_EMAIL,
    subject: "Test from Staart",
    message: `This is an example email to test your Staart email configuration.\n\n${JSON.stringify(
      {
        time: systemInfo.time(),
        package: {
          name: pkg.name,
          version: pkg.version,
          repository: pkg.repository,
          author: pkg.author,
          "staart-version": pkg["staart-version"]
        }
      }
    )}`
  })
    .then(() => {})
    .catch(() =>
      logError("Invalid email config", "Could not send a test email", 1)
    );

const getSystemInformation = async () => {
  return {
    name: pkg.name,
    version: pkg.version,
    repository: pkg.repository,
    author: pkg.author,
    "staart-version": pkg["staart-version"]
  };
};

getSystemInformation()
  .then(body =>
    elasticSearchIndex({
      index: ELASTIC_INSTANCES_INDEX,
      body
    })
  )
  .then(() => {})
  .catch(() => {});
