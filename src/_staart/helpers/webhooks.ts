import { logError } from "@staart/errors";
import { redisQueue } from "@staart/redis";
import axios from "axios";
import { createHmac } from "crypto";
import { Webhooks } from "../interfaces/enum";
import { webhooks } from "@prisma/client";
import { prisma } from "./prisma";
import { config } from "@anandchowdhary/cosmic";

const JWT_ISSUER = config("jwtIssuer");

const WEBHOOK_QUEUE = `${config("redisQueuePrefix")}-webhooks`;

let queueSetup = false;
/** Setup the webhook queue using Redis */
const setupQueue = async () => {
  if (queueSetup) return true;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes(WEBHOOK_QUEUE)) return (queueSetup = true);
  await redisQueue.createQueueAsync({ qname: WEBHOOK_QUEUE });
  return (queueSetup = true);
};

/** Queue a webhook for a group */
export const queueWebhook = (
  groupId: number,
  webhook: Webhooks,
  data?: any
) => {
  setupQueue()
    .then(() =>
      redisQueue.sendMessageAsync({
        qname: WEBHOOK_QUEUE,
        message: JSON.stringify({
          groupId,
          webhook,
          data,
          tryNumber: 1,
        }),
      })
    )
    .then(() => {})
    .catch(() => logError("Webhook queue", "Unable to queue webhook"));
};

/** Receive a webhook from a message and call the webhook */
export const receiveWebhookMessage = async () => {
  await setupQueue();
  const result = await redisQueue.receiveMessageAsync({
    qname: WEBHOOK_QUEUE,
  });
  if ("id" in result) {
    const {
      groupId,
      webhook,
      data,
      tryNumber,
    }: {
      tryNumber: number;
      groupId: string;
      webhook: Webhooks;
      data?: any;
    } = JSON.parse(result.message);
    if (tryNumber && tryNumber > 3) {
      logError("Webhook", `Unable to fire: ${groupId} ${webhook}`);
      return redisQueue.deleteMessageAsync({
        qname: WEBHOOK_QUEUE,
        id: result.id,
      });
    }
    try {
      safeFireWebhook(groupId, webhook, data);
    } catch (error) {
      await redisQueue.sendMessageAsync({
        qname: WEBHOOK_QUEUE,
        message: JSON.stringify({
          groupId,
          webhook,
          data,
          tryNumber: tryNumber + 1,
        }),
      });
    }
    await redisQueue.deleteMessageAsync({
      qname: WEBHOOK_QUEUE,
      id: result.id,
    });
    receiveWebhookMessage();
  }
};

/** Fire a webhook suppressing errors */
const safeFireWebhook = async (
  groupId: string,
  webhook: Webhooks,
  data?: any
) => {
  const webhooksToFire = await prisma.webhooks.findMany({
    where: { groupId: parseInt(groupId), event: webhook },
  });
  for await (const hook of webhooksToFire) {
    try {
      await fireSingleWebhook(hook, webhook, data);
    } catch (error) {}
  }
  return;
};

/** Fire a single webhook */
export const fireSingleWebhook = async (
  webhook: webhooks,
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
      "Content-Type": webhook.contentType,
    },
    data: {
      hookType,
      data,
    },
  };
  const result = await axios.post(webhook.url, options);
  if (webhook.id)
    await prisma.webhooks.update({
      where: { id: webhook.id },
      data: { lastFiredAt: new Date() },
    });
  return result;
};
