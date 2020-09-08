import {
  ClassMiddleware,
  Get,
  Patch,
  Request,
  Response,
  NextFunction,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  getGroupBillingForUser,
  getGroupPricingPlansForUser,
  updateGroupBillingForUser,
} from "../../../_staart/rest/group";
import { config } from "@anandchowdhary/cosmic";
import { safeError } from "../../../_staart/helpers/errors";

@ClassMiddleware(authHandler)
@ClassMiddleware(async (_: Request, res: Response, next: NextFunction) => {
  if (!config("enableStripePayments")) {
    const error = safeError("404/billing-not-enabled");
    res.status(error.status);
    return res.json(error);
  } else return next();
})
export class GroupBillingController {
  @Get()
  async getBilling(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    return getGroupBillingForUser(localsToTokenOrKey(res), groupId);
  }

  @Patch()
  async patchBilling(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    await updateGroupBillingForUser(
      localsToTokenOrKey(res),
      groupId,
      req.body,
      res.locals
    );
    return { success: true, message: "group-billing-updated" };
  }

  @Get("pricing")
  async getPlans(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.number().required(),
      },
      { groupId }
    );
    return getGroupPricingPlansForUser(localsToTokenOrKey(res), groupId);
  }
}
