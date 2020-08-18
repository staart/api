import { RESOURCE_CREATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Middleware,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi } from "@staart/validate";
import { authHandler, validator } from "../../_staart/helpers/middleware";
import { newGroupForUser } from "../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupController {
  @Put()
  @Middleware(
    validator(
      {
        name: Joi.string().required(),
      },
      "body"
    )
  )
  async put(req: Request, res: Response) {
    const added = await newGroupForUser(
      res.locals.token.id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }
}
