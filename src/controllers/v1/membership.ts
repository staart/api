import {
  getMembershipDetailsForUser,
  deleteMembershipForUser,
  updateMembershipForUser
} from "../../rest/membership";
import {
  Get,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  Middleware,
  Request,
  Response
} from "@staart/server";
import { authHandler, validator } from "../../helpers/middleware";
import { Joi } from "@staart/validate";

@Controller("v1/memberships")
@ClassMiddleware(authHandler)
export class MembershipController {
  @Get(":id")
  @Middleware(validator({ id: Joi.string().required() }, "params"))
  async get(req: Request, res: Response) {
    const membershipId = req.params.id;
    const userId = res.locals.token.id;
    return await getMembershipDetailsForUser(userId, membershipId);
  }

  @Delete(":id")
  @Middleware(validator({ id: Joi.string().required() }, "params"))
  async delete(req: Request, res: Response) {
    const userId = res.locals.token.id;
    const membershipId = req.params.id;
    await deleteMembershipForUser(userId, membershipId, res.locals);
    return { deleted: true };
  }

  @Patch(":id")
  @Middleware(validator({ id: Joi.string().required() }, "params"))
  async patch(req: Request, res: Response) {
    const userId = res.locals.token.id;
    const membershipId = req.params.id;
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(userId, membershipId, data, res.locals);
    return { success: true, message: "membership-updated" };
  }
}
