import * as ses from "node-ses";
import { Mail } from "../interfaces/mail";
import { SES_SECRET, SES_ACCESS, SES_EMAIL } from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import { render } from "mustache";
import marked from "marked";
import i18n from "../i18n";

const client = ses.createClient({ key: SES_ACCESS, secret: SES_SECRET });

export const sendMail = (mail: Mail) =>
  new Promise((resolve, reject) => {
    client.sendEmail(mail, (error: Error, data: any, response: any) => {
      if (error) return reject(error);
      resolve(response);
    });
  });

export const mail = async (
  to: number | string,
  template: string,
  data: any = {}
) => {
  const altText = render(
    (await readFile(
      join(__dirname, "..", "..", "src", "templates", `${template}.md`)
    )).toString(),
    data
  );
  const message = marked(altText);
  return await sendMail({
    from: SES_EMAIL,
    to: to.toString(),
    subject: i18n.en.emails["verify-email"],
    message,
    altText
  });
};
