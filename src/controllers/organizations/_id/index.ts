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
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import {
  localsToTokenOrKey,
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  deleteGroupForUser,
  getAllGroupDataForUser,
  getGroupForUser,
  newGroupForUser,
  updateGroupForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupController {
  @Get()
  async get(req: Request, res: Response) {
    const id = await groupUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
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
    const id = await groupUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
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
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    await deleteGroupForUser(res.locals.token.id, groupId, res.locals);
    return respond(RESOURCE_DELETED);
  }

  @Get("data")
  async getData(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    return getAllGroupDataForUser(localsToTokenOrKey(res), groupId);
  }
}
