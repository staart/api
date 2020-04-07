import { RESOURCE_DELETED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
  Delete,
  Get,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../helpers/middleware";
import { userUsernameToId } from "../../helpers/utils";
import {
  deleteSessionForUser,
  getUserSessionForUser,
  getUserSessionsForUser,
} from "../../rest/user";

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
        itemsPerPage: Joi.number(),
      },
      sessionParams
    );
    return getUserSessionsForUser(res.locals.token.id, id, sessionParams);
  }

  @Get(":sessionId")
  async getUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required(),
      },
      { id, sessionId }
    );
    return getUserSessionForUser(res.locals.token.id, id, sessionId);
  }

  @Delete(":sessionId")
  async deleteUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required(),
      },
      { id, sessionId }
    );
    await deleteSessionForUser(res.locals.token.id, id, sessionId, res.locals);
    return respond(RESOURCE_DELETED);
  }
}
