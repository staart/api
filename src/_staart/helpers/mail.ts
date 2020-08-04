import { logError } from "@staart/errors";
import { Mail, sendMail } from "@staart/mail";
import { render } from "@staart/mustache-markdown";
import { redisQueue } from "@staart/redis";
import { readFile } from "fs-extra";
import { join } from "path";
import { FRONTEND_URL, REDIS_QUEUE_PREFIX } from "../../config";
import { PartialBy } from "../../_staart/helpers/utils";

const MAIL_QUEUE = `${REDIS_QUEUE_PREFIX}outbound-emails`;

let queueSetup = false;
const setupQueue = async () => {
  if (queueSetup) return true;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes(MAIL_QUEUE)) return (queueSetup = true);
  await redisQueue.createQueueAsync({ qname: MAIL_QUEUE });
  return (queueSetup = true);
};

export const receiveEmailMessage = async () => {
  await setupQueue();
  const result = await redisQueue.receiveMessageAsync({
    qname: MAIL_QUEUE,
  });
  if ("id" in result) {
    const data: PartialBy<PartialBy<Mail, "subject">, "message"> & {
      template?: string;
      data?: any;
      tryNumber: number;
    } = JSON.parse(result.message);
    if (data.tryNumber && data.tryNumber > 3) {
      logError("Email", `Unable to send email: ${data.to}`);
      return redisQueue.deleteMessageAsync({
        qname: MAIL_QUEUE,
        id: result.id,
      });
    }
    try {
      await safeSendEmail(data);
    } catch (error) {
      console.log(error);
      await redisQueue.sendMessageAsync({
        qname: MAIL_QUEUE,
        message: JSON.stringify({
          ...data,
          tryNumber: (data.tryNumber || 0) + 1,
        }),
      });
    }
    await redisQueue.deleteMessageAsync({
      qname: MAIL_QUEUE,
      id: result.id,
    });
    receiveEmailMessage();
  }
};

/**
 * Send a new email using AWS SES or SMTP
 */
export const mail = async (
  options: PartialBy<PartialBy<Mail, "subject">, "message"> & {
    template?: string;
    data?: any;
  }
) => {
  await setupQueue();
  await redisQueue.sendMessageAsync({
    qname: MAIL_QUEUE,
    message: JSON.stringify({ ...options, tryNumber: 1 }),
  });
};

const safeSendEmail = async (
  options: PartialBy<PartialBy<Mail, "subject">, "message"> & {
    template?: string;
    data?: any;
  }
) => {
  options.subject = options.subject || "";
  options.message = options.message || "";
  if (options.template) {
    const result = render(
      (
        await readFile(
          join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "src",
            "templates",
            `${options.template}.md`
          )
        )
      ).toString(),
      { ...options.data, frontendUrl: FRONTEND_URL }
    );
    options.altText = result[0];
    options.message = result[1];
    options.subject = result[1]
      .split("\n", 1)[0]
      .replace(/<\/?[^>]+(>|$)/g, "");
  }
  return sendMail(
    options as Mail & {
      template?: string;
      data?: any;
    }
  );
};
