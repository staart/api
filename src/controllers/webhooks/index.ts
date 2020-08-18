import { Get, Middleware, Request, Response } from "@staart/server";
import { stripeWebhookAuthHandler } from "../../_staart/helpers/middleware";
import { StripeLocals } from "../../_staart/interfaces/general";

export class WebhooksController {
  @Get("stripe")
  @Middleware(stripeWebhookAuthHandler)
  async stripeWebhook(req: Request, res: Response) {
    const locals = res.locals as StripeLocals;
    console.log("Received Stripe event", locals.stripeEvent);
    return { hello: "world" };
  }
}
