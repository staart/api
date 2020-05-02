import { MISSING_FIELD } from "@staart/errors";
import {
  ClassMiddleware,
  Middleware,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi } from "@staart/validate";
import { authHandler, validator } from "../../_staart/helpers/middleware";
import { generateCouponForUser } from "../../_staart/rest/admin";

@ClassMiddleware(authHandler)
export class AdminCouponController {
  @Put()
  @Middleware(
    validator(
      {
        amount: Joi.number().required(),
        currency: Joi.string().min(3).max(3).required(),
        description: Joi.string(),
      },
      "body"
    )
  )
  async createCoupon(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    const couponCode = await generateCouponForUser(userId, req.body);
    return { couponCode };
  }
}
