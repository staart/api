import {
  getUserFromId,
  updateUserForUser,
  deleteUserForUser
} from "../../../rest/user";
import {
  Get,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response,
  Middleware,
  ChildControllers
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import { respond, RESOURCE_UPDATED, RESOURCE_DELETED } from "@staart/messages";
import { userUsernameToId } from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";
import { UserMembershipsController } from "./memberships";
import { UserEmailsController } from "./emails";
import { UserSecurityController } from "./security";
import { UserAccessTokensController } from "./access-tokens";
import { UserSessionsController } from "./sessions";
import { UserIdentitiesController } from "./identities";

@Controller("users")
@ChildControllers([
  new UserMembershipsController(),
  new UserEmailsController(),
  new UserSecurityController(),
  new UserAccessTokensController(),
  new UserSessionsController(),
  new UserIdentitiesController()
])
@ClassMiddleware(authHandler)
export class UserController {
  @Get(":id")
  async get(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getUserFromId(id, res.locals.token.id);
  }

  @Patch(":id")
  @Middleware(
    validator(
      {
        name: Joi.string()
          .min(3)
          .regex(/^[a-zA-Z ]*$/),
        username: Joi.string().regex(/^[a-z0-9\-]+$/i),
        nickname: Joi.string(),
        primaryEmail: Joi.string(),
        countryCode: Joi.string().length(2),
        password: Joi.string().min(6),
        gender: Joi.string().length(1),
        preferredLanguage: Joi.string()
          .min(2)
          .max(5),
        timezone: Joi.string(),
        notificationEmails: Joi.number(),
        prefersReducedMotion: Joi.boolean(),
        prefersColorSchemeDark: Joi.boolean(),
        profilePicture: Joi.string(),
        checkLocationOnLogin: Joi.boolean()
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await deleteUserForUser(res.locals.token.id, id, res.locals);
    return respond(RESOURCE_DELETED);
  }
}
