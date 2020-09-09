import { elasticSearch, elasticSearchEnabled } from "@staart/elasticsearch";
import { logError } from "@staart/errors";
import { redisQueue } from "@staart/redis";
import { config } from "@anandchowdhary/cosmic";

const ELASTIC_QUEUE = `${config("redisQueuePrefix")}_es-records`;

let queueSetup = false;
/** Setup the Redis queue to ElasticSearch records */
const setupQueue = async () => {
  if (queueSetup) return true;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes(ELASTIC_QUEUE)) return (queueSetup = true);
  await redisQueue.createQueueAsync({ qname: ELASTIC_QUEUE });
  return (queueSetup = true);
};

/**
 * Add a new record to an ElasticSearch index
 * @param indexParams - Params (index and body)
 */
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

/** Receieve new messages from the queue and index records */
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
