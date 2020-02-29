import { Webhooks } from "../interfaces/enum";
import {
  getOrganizationEventWebhooks,
  updateWebhook
} from "../crud/organization";
import { Webhook } from "../interfaces/tables/organization";
import { createHmac } from "crypto";
import axios from "axios";
import { JWT_ISSUER, REDIS_QUEUE_PREFIX } from "../config";
import { redisQueue } from "@staart/redis";
import { logError } from "@staart/errors";

const WEBHOOK_QUEUE = `${REDIS_QUEUE_PREFIX}webhooks`;

let queueSetup = false;
const setupQueue = async () => {
  if (queueSetup) return true;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes(WEBHOOK_QUEUE)) return (queueSetup = true);
  redisQueue.createQueueAsync({ qname: WEBHOOK_QUEUE });
  return (queueSetup = true);
};

export const queueWebhook = (
  organizationId: string,
  webhook: Webhooks,
  data?: any
) => {
  setupQueue()
    .then(() =>
      redisQueue.sendMessageAsync({
        qname: WEBHOOK_QUEUE,
        message: JSON.stringify({ organizationId, webhook, data, tryNumber: 1 })
      })
    )
    .then(() => {})
    .catch(() => logError("Webhook queue", "Unable to queue webhook"));
};

export const receiveWebhookMessage = async () => {
  await setupQueue();
  const result = await redisQueue.receiveMessageAsync({
    qname: WEBHOOK_QUEUE
  });
  if ("id" in result) {
    const {
      organizationId,
      webhook,
      data,
      tryNumber
    }: {
      tryNumber: number;
      organizationId: string;
      webhook: Webhooks;
      data?: any;
    } = JSON.parse(result.message);
    if (tryNumber && tryNumber > 3) {
      logError("Webhook", `Unable to fire: ${organizationId} ${webhook}`);
      return await redisQueue.deleteMessageAsync({
        qname: WEBHOOK_QUEUE,
        id: result.id
      });
    }
    try {
      safeFireWebhook(organizationId, webhook, data);
    } catch (error) {
      await redisQueue.sendMessageAsync({
        qname: WEBHOOK_QUEUE,
        message: JSON.stringify({
          organizationId,
          webhook,
          data,
          tryNumber: tryNumber + 1
        })
      });
    }
    await redisQueue.deleteMessageAsync({
      qname: WEBHOOK_QUEUE,
      id: result.id
    });
    receiveWebhookMessage();
  }
};

const safeFireWebhook = async (
  organizationId: string,
  webhook: Webhooks,
  data?: any
) => {
  const webhooksToFire = await getOrganizationEventWebhooks(
    organizationId,
    webhook
  );
  for await (const hook of webhooksToFire) {
    try {
      await fireSingleWebhook(hook, webhook, data);
    } catch (error) {}
  }
  return;
};

const fireSingleWebhook = async (
  webhook: Webhook,
  hookType: Webhooks,
  data?: any
) => {
  let secret;
  if (webhook.secret)
    secret = createHmac("sha1", webhook.secret)
      .update(data || "")
      .digest("hex");
  const options = {
    headers: {
      "User-Agent": `${JWT_ISSUER}-webhook-service`,
      "X-Signature": secret,
      "Content-Type": webhook.contentType
    },
    data: {
      hookType,
      data
    }
  };
  const result = await axios.post(webhook.url, options);
  if (webhook.id)
    await updateWebhook(webhook.organizationId, webhook.id, {
      lastFiredAt: new Date()
    });
  return result;
};
