import { ClassMiddleware, Get, Patch, Request, Response } from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import {
  groupUsernameToId,
  localsToTokenOrKey,
} from "../../../_staart/helpers/utils";
import {
  getGroupBillingForUser,
  getGroupPricingPlansForUser,
  updateGroupBillingForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupBillingController {
  @Get()
  async getBilling(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    return getGroupBillingForUser(localsToTokenOrKey(res), groupId);
  }

  @Patch()
  async patchBilling(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
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
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.string().required(),
      },
      { groupId }
    );
    return getGroupPricingPlansForUser(localsToTokenOrKey(res), groupId);
  }
}
