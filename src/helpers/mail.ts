import { FRONTEND_URL } from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import i18n from "../i18n";
import { sendMail } from "@staart/mail";
import { render } from "@staart/mustache-markdown";
import { redisQueue } from "@staart/redis";
import { logError } from "@staart/errors";

let queueSetup = false;
const setupQueue = async () => {
  if (queueSetup) return;
  const queues = redisQueue.listQueuesAsync();
  if ((await queues).includes("outbound-emails")) return (queueSetup = true);
  redisQueue.createQueueAsync({ qname: "outbound-emails" });
  queueSetup = true;
};

export const receiveEmailMessage = async () => {
  await setupQueue();
  const result = await redisQueue.receiveMessageAsync({
    qname: "outbound-emails"
  });
  if ("id" in result) {
    console.log("Got message", result.id);
    const {
      to,
      template,
      data
    }: {
      to: number | string;
      template: string;
      data: any;
    } = JSON.parse(result.message);
    try {
      await safeSendEmail(to, template, data);
      redisQueue.deleteMessageAsync({
        qname: "outbound-emails",
        id: result.id
      });
    } catch (error) {
      logError("Mail", "Unable to send email");
    }
    receiveEmailMessage();
  }
};

/**
 * Send a new email using AWS SES or SMTP
 */
export const mail = async (
  to: number | string,
  template: string,
  data: any = {}
) => {
  await setupQueue();
  const result = await redisQueue.sendMessageAsync({
    qname: "outbound-emails",
    message: JSON.stringify({ to, template, data })
  });
  console.log("Queued email", result);
};

const safeSendEmail = async (
  to: number | string,
  template: string,
  data: any = {}
) => {
  const result = render(
    (
      await readFile(
        join(__dirname, "..", "..", "..", "src", "templates", `${template}.md`)
      )
    ).toString(),
    { ...data, frontendUrl: FRONTEND_URL }
  );
  const altText = result[0];
  const message = result[1];
  return await sendMail({
    to: to.toString(),
    subject: i18n.en.emails[template] || "",
    message,
    altText
  });
};
