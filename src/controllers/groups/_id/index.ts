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
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  deleteGroupForUser,
  getAllGroupDataForUser,
  getGroupForUser,
  updateGroupForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupController {
  @Get()
  async get(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const group = await getGroupForUser(localsToTokenOrKey(res), id);
    return group;
  }

  @Patch()
  @Middleware(
    validator(
      {
        name: Joi.string(),
        username: Joi.string().regex(/^[a-z0-9\-]+$/i),
        forceTwoFactor: Joi.boolean(),
        autoJoinDomain: Joi.boolean(),
        onlyAllowDomain: Joi.boolean(),
        ipRestrictions: Joi.string(),
        profilePicture: Joi.string(),
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const updated = await updateGroupForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED, { resource: "Team" }), updated };
  }

  @Delete()
  async delete(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    await deleteGroupForUser(res.locals.token.id, groupId, res.locals);
    return respond(RESOURCE_DELETED);
  }

  @Get("data")
  async getData(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    return getAllGroupDataForUser(localsToTokenOrKey(res), groupId);
  }
}
