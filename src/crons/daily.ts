import { elasticSearch, elasticSearchEnabled } from "@staart/elasticsearch";
import { ms } from "@staart/text";
import { CronJob } from "cron";
import { ELASTIC_LOGS_INDEX } from "../config";

export default () => {
  new CronJob(
    "0 0 * * *",
    async () => {
      await deleteOldLogs();
    },
    undefined,
    true
  );
};

const deleteOldLogs = async () => {
  if (elasticSearchEnabled)
    return (
      await elasticSearch.deleteByQuery({
        index: ELASTIC_LOGS_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    date: {
                      lte: new Date(new Date().getTime() - ms("92 days")),
                    },
                  },
                },
              ],
            },
          },
        },
      })
    ).body;
};
