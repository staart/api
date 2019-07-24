import { Webhooks } from "../interfaces/enum";
import {
  getOrganizationEventWebhooks,
  updateWebhook
} from "../crud/organization";
import { Webhook } from "../interfaces/tables/organization";
import { createHmac } from "crypto";
import axios from "axios";
import { JWT_ISSUER } from "../config";

export const queueWebhook = (
  organizationId: number,
  webhook: Webhooks,
  data?: any
) => {
  safeFireWebhook(organizationId, webhook, data)
    .then(() => {})
    .catch(() => {});
};

export const safeFireWebhook = async (
  organizationId: number,
  webhook: Webhooks,
  data?: any
) => {
  const webhooksToFire = await getOrganizationEventWebhooks(
    organizationId,
    webhook
  );
  for await (const hook of webhooksToFire) {
    try {
      await fireSingleWebhook(hook, data);
    } catch (error) {}
  }
  return;
};

const fireSingleWebhook = async (webhook: Webhook, data?: any) => {
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
    data
  };
  const result = await axios.post(webhook.url, options);
  if (webhook.id)
    await updateWebhook(webhook.organizationId, webhook.id, {
      lastFiredAt: new Date()
    });
  return result;
};
