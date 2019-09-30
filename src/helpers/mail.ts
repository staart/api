import { createClient, SendEmailError, SendEmailData } from "node-ses";
import { Response } from "request";
import { Mail } from "../interfaces/mail";
import {
  SES_SECRET,
  SES_ACCESS,
  SES_EMAIL,
  SES_REGION,
  FRONTEND_URL,
  TEST_EMAIL
} from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import { render } from "mustache";
import marked from "marked";
import { isMatch } from "matcher";
import disposableDomains from "disposable-email-domains/index.json";
import wildcardDomains from "disposable-email-domains/wildcard.json";
import i18n from "../i18n";
import Joi from "@hapi/joi";
import { joiValidate } from "./utils";
import { ErrorCode } from "../interfaces/enum";
import { logError } from "./errors";
import systemInfo from "systeminformation";
import pkg from "../../package.json";

const client = createClient({
  key: SES_ACCESS,
  secret: SES_SECRET,
  amazon: `https://email.${SES_REGION}.amazonaws.com`
});

/**
 * Send a new email using AWS SES
 */
const sendMail = (mail: Mail): Promise<Response> =>
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
      join(__dirname, "..", "..", "..", "src", "templates", `${template}.md`)
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

export const checkIfDisposableEmail = (email: string) => {
  let isDisposable = false;
  joiValidate(
    {
      email: Joi.string()
        .email()
        .required()
    },
    { email }
  );
  const domain = email.split("@")[1];
  if (disposableDomains.includes(domain))
    throw new Error(ErrorCode.DISPOSABLE_EMAIL);
  const potentialMatches = wildcardDomains.filter(w => domain.includes(w));
  potentialMatches.forEach(
    d => (isDisposable = isDisposable || isMatch(email, `*.${d}`))
  );
  if (isDisposable) throw new Error(ErrorCode.DISPOSABLE_EMAIL);
  return;
};

sendMail({
  from: SES_EMAIL,
  to: TEST_EMAIL,
  subject: "Test from Staart",
  message: `This is an example email to test your Staart email configuration.\n\n${JSON.stringify(
    {
      time: systemInfo.time(),
      package: {
        name: pkg.name,
        version: pkg.version,
        repository: pkg.repository,
        author: pkg.author,
        "staart-version": pkg["staart-version"]
      }
    }
  )}`
})
  .then(() => {})
  .catch(() =>
    logError("Invalid email config", "Could not send a test email", 1)
  );
