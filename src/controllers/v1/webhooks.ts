import { Get, Controller, Request, Response, Middleware } from "@staart/server";
import { stripeWebhookAuthHandler } from "../../helpers/middleware";
import { StripeLocals } from "../../interfaces/general";

@Controller("v1/webhooks")
export class AdminController {
  @Get("stripe")
  @Middleware(stripeWebhookAuthHandler)
  async stripeWebhook(req: Request, res: Response) {
    const locals = res.locals as StripeLocals;
    console.log("Received Stripe event", locals.stripeEvent);
    return { hello: "world" };
  }
}
