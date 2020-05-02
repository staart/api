import { MISSING_FIELD } from "@staart/errors";
import { RESOURCE_CREATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Middleware,
  Delete,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi } from "@staart/validate";
import { authHandler, validator } from "../../_staart/helpers/middleware";
import {
  getAllCouponsForUser,
  getCouponForUser,
  updateCouponForUser,
  deleteCouponForUser,
  generateCouponForUser,
} from "../../_staart/rest/admin";

@ClassMiddleware(authHandler)
export class AdminCouponController {
  @Get()
  async getCoupons(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getAllCouponsForUser(userId, req.query);
  }

  @Put()
  @Middleware(
    validator(
      {
        amount: Joi.number().required(),
        currency: Joi.string().min(3).max(3).required(),
        description: Joi.string(),
        jwt: Joi.boolean(),
      },
      "body"
    )
  )
  async createCoupon(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    const added = await generateCouponForUser(userId, req.body);
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":id")
  async getCoupon(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return getCouponForUser(userId, req.params.id);
  }

  @Patch(":id")
  @Middleware(
    validator(
      {
        amount: Joi.number(),
        currency: Joi.string().min(3).max(3),
        description: Joi.string().allow(null),
        jwt: Joi.boolean(),
      },
      "body"
    )
  )
  async updateCoupon(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return updateCouponForUser(userId, req.params.id, req.body);
  }

  @Delete(":id")
  async deleteCoupon(req: Request, res: Response) {
    const userId = res.locals.token.id;
    if (!userId) throw new Error(MISSING_FIELD);
    return deleteCouponForUser(userId, req.params.id);
  }
}
