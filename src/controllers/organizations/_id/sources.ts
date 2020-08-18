import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  createGroupSourceForUser,
  deleteGroupSourceForUser,
  getGroupSourceForUser,
  getGroupSourcesForUser,
  updateGroupSourceForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupSourcesController {
  @Get()
  async getSources(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    const subscriptionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      subscriptionParams
    );
    return getGroupSourcesForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionParams
    );
  }

  @Put()
  async putSources(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    joiValidate({ groupId: Joi.number().required() }, { groupId });
    await createGroupSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":sourceId")
  async getSource(req: Request, res: Response) {
    const groupId = twtToId(req.params.id);
    const sourceId = req.params.sourceId;
    joiValidate(
      {
        groupId: Joi.number().required(),
        sourceId: Joi.number().required(),
      },
      { groupId, sourceId }
    );
    return getGroupSourceForUser(localsToTokenOrKey(res), groupId, sourceId);
  }

  @Patch(":sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const groupId = twtToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.number().required(),
        sourceId: Joi.number().required(),
      },
      { groupId, sourceId }
    );
    const updated = await updateGroupSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      sourceId,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":sourceId")
  async deleteSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const groupId = twtToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.number().required(),
        sourceId: Joi.number().required(),
      },
      { groupId, sourceId }
    );
    await deleteGroupSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      sourceId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
