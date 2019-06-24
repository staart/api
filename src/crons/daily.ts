import { CronJob } from "cron";

export default () => {
  new CronJob(
    "0 0 * * *",
    () => {
      console.log("Once per day", new Date());
    },
    undefined,
    true
  );
};
