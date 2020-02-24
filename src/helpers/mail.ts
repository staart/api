import { FRONTEND_URL, TEST_EMAIL } from "../config";
import { readFile } from "fs-extra";
import { join } from "path";
import { render } from "mustache";
import marked from "marked";
import i18n from "../i18n";
import { logError } from "@staart/errors";
import { sendMail } from "@staart/mail";
import systemInfo from "systeminformation";
import pkg from "../../package.json";

/**
 * Send a new email using AWS SES
 */
export const mail = async (
  to: number | string,
  template: string,
  data: any = {}
) => {
  const altText = render(
    (
      await readFile(
        join(__dirname, "..", "..", "..", "src", "templates", `${template}.md`)
      )
    ).toString(),
    { ...data, frontendUrl: FRONTEND_URL }
  );
  const message = marked(altText);
  return await sendMail({
    to: to.toString(),
    subject: i18n.en.emails[template] || "",
    message,
    altText
  });
};

sendMail({
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
