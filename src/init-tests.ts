import { TEST_EMAIL } from "./config";
import { logError, success } from "@staart/errors";
import { sendMail, setupTransporter } from "@staart/mail";
import systemInfo from "systeminformation";
import pkg from "../package.json";
import redis from "@staart/redis";

redis
  .set(pkg.name, systemInfo.time().current)
  .then(() => redis.del(pkg.name))
  .then(() => success("Redis is listening"))
  .catch(() => logError("Redis", "Unable to connect"));

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
