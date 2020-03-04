import {
  deleteSessionForUser,
  getUserSessionForUser,
  getUserSessionsForUser
} from "../../../rest/user";
import {
  Get,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response
} from "@staart/server";
import { authHandler } from "../../../helpers/middleware";
import { respond, RESOURCE_DELETED } from "@staart/messages";
import { userUsernameToId } from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

@Controller(":id/sessions")
@ClassMiddleware(authHandler)
export class UserSessionsController {
  @Get()
  async getUserSessions(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const sessionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      sessionParams
    );
    return await getUserSessionsForUser(res.locals.token.id, id, sessionParams);
  }

  @Get(":sessionId")
  async getUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required()
      },
      { id, sessionId }
    );
    return await getUserSessionForUser(res.locals.token.id, id, sessionId);
  }

  @Delete(":sessionId")
  async deleteUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required()
      },
      { id, sessionId }
    );
    await deleteSessionForUser(res.locals.token.id, id, sessionId, res.locals);
    return respond(RESOURCE_DELETED);
  }
}
