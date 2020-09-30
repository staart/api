import { config } from "@anandchowdhary/cosmic";
import { ms } from "@staart/text";
import { CronJob } from "cron";
import { prisma } from "../_staart/helpers/prisma";
const TOKEN_EXPIRY_REFRESH = config<string>("tokenExpiryRefresh");

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
