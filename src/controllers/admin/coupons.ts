import { MISSING_FIELD } from "@staart/errors";
import { RESOURCE_CREATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Middleware,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi } from "@staart/validate";
import { authHandler, validator } from "../../_staart/helpers/middleware";
import {
  deleteCouponForUser,
  generateCouponForUser,
  getAllCouponsForUser,
  getCouponForUser,
  updateCouponForUser,
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
        code: Joi.string(),
        teamRestrictions: Joi.string(),
        amount: Joi.number().required(),
        currency: Joi.string().min(3).max(3).required(),
        description: Joi.string(),
        jwt: Joi.boolean(),
        expiresAt: Joi.any(),
        maxUses: Joi.number(),
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
        code: Joi.string(),
        amount: Joi.number(),
        currency: Joi.string().min(3).max(3),
        description: Joi.string().allow(null),
        expiresAt: Joi.any().allow(null),
        teamRestrictions: Joi.string().allow(null),
        maxUses: Joi.number().allow(null),
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
