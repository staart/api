import { ms } from "@staart/text";
import { CronJob } from "cron";
import { TOKEN_EXPIRY_REFRESH } from "../config";
import { query, tableName } from "../helpers/mysql";
import { Session } from "../interfaces/tables/user";

export default () => {
  new CronJob(
    "0 * * * *",
    async () => {
      await deleteExpiredSessions();
    },
    undefined,
    true
  );
};

const deleteExpiredSessions = async () => {
  await query(`DELETE FROM ${tableName("sessions")} WHERE createdAt < ?`, [
    new Date(new Date().getTime() - ms(TOKEN_EXPIRY_REFRESH))
  ]);
};
