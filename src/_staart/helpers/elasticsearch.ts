import { elasticSearch, elasticSearchEnabled } from "@staart/elasticsearch";
import { logError } from "@staart/errors";
import { redisQueue } from "@staart/redis";
import { REDIS_QUEUE_PREFIX } from "../../config";

const ELASTIC_QUEUE = `${REDIS_QUEUE_PREFIX}es-records`;

let queueSetup = false;
const setupQueue = async () => {
  if (queueSetup) return true;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes(ELASTIC_QUEUE)) return (queueSetup = true);
  await redisQueue.createQueueAsync({ qname: ELASTIC_QUEUE });
  return (queueSetup = true);
};

export const elasticSearchIndex = async (indexParams: {
  index: string;
  body: any;
}) => {
  await setupQueue();
  await redisQueue.sendMessageAsync({
    qname: ELASTIC_QUEUE,
    message: JSON.stringify({ indexParams, tryNumber: 1 }),
  });
};

export const receiveElasticSearchMessage = async () => {
  await setupQueue();
  const result = await redisQueue.receiveMessageAsync({
    qname: ELASTIC_QUEUE,
  });
  if ("id" in result) {
    if (!elasticSearchEnabled)
      return redisQueue.deleteMessageAsync({
        qname: ELASTIC_QUEUE,
        id: result.id,
      });
    const {
      indexParams,
      tryNumber,
    }: {
      tryNumber: number;
      indexParams: {
        index: string;
        body: string;
        type: string;
      };
    } = JSON.parse(result.message);
    if (tryNumber && tryNumber > 3)
      return redisQueue.deleteMessageAsync({
        qname: ELASTIC_QUEUE,
        id: result.id,
      });
    try {
      await elasticSearch.index(indexParams);
    } catch (error) {
      logError(
        "ElasticSearch",
        `Unable to save record, trying again: ${JSON.stringify(error)}`
      );
      await redisQueue.sendMessageAsync({
        qname: ELASTIC_QUEUE,
        message: JSON.stringify({
          indexParams,
          tryNumber: tryNumber + 1,
        }),
      });
    }
    await redisQueue.deleteMessageAsync({
      qname: ELASTIC_QUEUE,
      id: result.id,
    });
    receiveElasticSearchMessage();
  }
};
