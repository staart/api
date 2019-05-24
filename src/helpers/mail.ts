import { createClient, SendEmailError, SendEmailData } from "node-ses";
import { Response } from "request";
import { Mail } from "../interfaces/mail";
import {
  SES_SECRET,
  SES_ACCESS,
  SES_EMAIL,
  SES_REGION,
  FRONTEND_URL
} from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import { render } from "mustache";
import marked from "marked";
import i18n from "../i18n";

const client = createClient({
  key: SES_ACCESS,
  secret: SES_SECRET,
  amazon: `https://email.${SES_REGION}.amazonaws.com`
});

/**
 * Send a new email using AWS SES
 */
const sendMail = (mail: Mail) =>
  new Promise((resolve, reject) => {
    client.sendEmail(
      mail,
      (error: SendEmailError, data: SendEmailData, response: Response) => {
        if (error) return reject(error);
        resolve(response);
      }
    );
  });

/**
 * Send a new email using AWS SES
 */
export const mail = async (
  to: number | string,
  template: string,
  data: any = {}
) => {
  const altText = render(
    (await readFile(
      join(__dirname, "..", "..", "src", "templates", `${template}.md`)
    )).toString(),
    { ...data, frontendUrl: FRONTEND_URL }
  );
  const message = marked(altText);
  return await sendMail({
    from: SES_EMAIL,
    to: to.toString(),
    subject: i18n.en.emails[template] || "",
    message,
    altText
  });
};
