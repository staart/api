import { FRONTEND_URL } from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import i18n from "../i18n";
import { sendMail } from "@staart/mail";
import { render } from "@staart/mustache-markdown";

/**
 * Send a new email using AWS SES or SMTP
 */
export const mail = async (
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
