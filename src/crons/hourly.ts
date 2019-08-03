import { CronJob } from "cron";
import { query, tableName } from "../helpers/mysql";
import ms from "ms";
import { TOKEN_EXPIRY_REFRESH } from "../config";
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
