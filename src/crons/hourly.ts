import { ms } from "@staart/text";
import { CronJob } from "cron";
import { TOKEN_EXPIRY_REFRESH } from "../config";
import { prisma } from "../_staart/helpers/prisma";

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
  await prisma.sessions.deleteMany({
    where: {
      createdAt: {
        lte: new Date(new Date().getTime() - ms(TOKEN_EXPIRY_REFRESH)),
      },
    },
  });
};
