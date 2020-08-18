import { RESOURCE_DELETED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId } from "../../../_staart/helpers/utils";
import {
  deleteSessionForUser,
  getUserSessionForUser,
  getUserSessionsForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserSessionsController {
  @Get()
  async getUserSessions(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getUserSessionsForUser(res.locals.token.id, id, req.query);
  }

  @Get(":sessionId")
  async getUserSession(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const sessionId = twtToId(req.params.sessionId);
    joiValidate(
      {
        id: Joi.number().required(),
        sessionId: Joi.number().required(),
      },
      { id, sessionId }
    );
    return getUserSessionForUser(res.locals.token.id, id, sessionId);
  }

  @Delete(":sessionId")
  async deleteUserSession(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const sessionId = twtToId(req.params.sessionId);
    joiValidate(
      {
        id: Joi.number().required(),
        sessionId: Joi.number().required(),
      },
      { id, sessionId }
    );
    await deleteSessionForUser(res.locals.token.id, id, sessionId, res.locals);
    return respond(RESOURCE_DELETED);
  }
}
