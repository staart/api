import { logError } from "@staart/errors";
import { sendMail } from "@staart/mail";
import { render } from "@staart/mustache-markdown";
import { redisQueue } from "@staart/redis";
import { readFile } from "fs-extra";
import { join } from "path";
import { FRONTEND_URL, REDIS_QUEUE_PREFIX } from "../../config";

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
    const data = JSON.parse(result.message);
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
export const mail = async ({
  to,
  template,
  data,
}: {
  to: string;
  template?: string;
  data?: any;
}) => {
  await setupQueue();
  await redisQueue.sendMessageAsync({
    qname: MAIL_QUEUE,
    message: JSON.stringify({ to, template, data, tryNumber: 1 }),
  });
};

const safeSendEmail = async ({
  to,
  template,
  data,
}: {
  to: string;
  template?: string;
  data?: any;
}) => {
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
          `${template}.md`
        )
      )
    ).toString(),
    { ...data, frontendUrl: FRONTEND_URL }
  );
  const altText = result[0];
  const message = result[1];
  return sendMail({
    to: to.toString(),
    subject: result[1].split("\n", 1)[0].replace(/<\/?[^>]+(>|$)/g, ""),
    message,
    altText,
  });
};
