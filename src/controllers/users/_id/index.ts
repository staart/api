import { RESOURCE_DELETED, RESOURCE_UPDATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Middleware,
  Patch,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import { twtToId } from "../../../_staart/helpers/utils";
import {
  deleteUserForUser,
  getUserFromIdForUser,
  updateUserForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserController {
  @Get()
  async get(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getUserFromIdForUser(id, res.locals.token.id, req.query);
  }

  @Patch()
  @Middleware(
    validator(
      {
        name: Joi.string()
          .min(3)
          .regex(/^[a-zA-Z ]*$/),
        username: Joi.string().regex(/^[a-z0-9\-]+$/i),
        nickname: Joi.string(),
        primaryEmail: [Joi.string(), Joi.number()],
        countryCode: Joi.string().length(2),
        password: Joi.string().min(6),
        gender: Joi.string()
          .allow("MALE", "FEMALE", "NONBINARY", "UNKNOWN")
          .only(),
        timezone: Joi.string(),
        notificationEmails: Joi.string()
          .allow("ACCOUNT", "UPDATES", "PROMOTIONS")
          .only(),
        prefersLanguage: Joi.string().min(2).max(5),
        prefersReducedMotion: Joi.string()
          .allow("NO_PREFERENCE", "REDUCE")
          .only(),
        prefersColorScheme: Joi.string()
          .allow("NO_PREFERENCE", "LIGHT", "DARK")
          .only(),
        profilePicture: Joi.string(),
        checkLocationOnLogin: Joi.boolean(),
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const updated = await updateUserForUser(
      res.locals.token.id,
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete()
  async delete(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    await deleteUserForUser(res.locals.token.id, id, res.locals);
    return respond(RESOURCE_DELETED);
  }
}
