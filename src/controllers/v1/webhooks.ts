import { Request, Response } from "express";
import {
  Get,
  Controller,
  ClassWrapper,
  ClassMiddleware
} from "@overnightjs/core";
import asyncHandler from "express-async-handler";
import { stripeWebhookAuthHandler } from "../../helpers/middleware";
import { StripeLocals } from "../../interfaces/general";

@Controller("v1/webhooks")
@ClassMiddleware(stripeWebhookAuthHandler)
@ClassWrapper(asyncHandler)
export class AdminController {
  @Get("stripe")
  async stripeWebhook(req: Request, res: Response) {
    const locals = res.locals as StripeLocals;
    console.log("Received Stripe event", locals.stripeEvent);
    return res.json({ hello: "world" });
  }
}
