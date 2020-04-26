import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import {
  ChildControllers,
  ClassMiddleware,
  Controller,
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
import { newOrganizationForUser } from "../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationController {
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
    const added = await newOrganizationForUser(
      res.locals.token.id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }
}
