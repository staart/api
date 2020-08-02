import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import {
  localsToTokenOrKey,
  groupUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  createOrganizationSourceForUser,
  deleteOrganizationSourceForUser,
  getOrganizationSourceForUser,
  getOrganizationSourcesForUser,
  updateOrganizationSourceForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class OrganizationSourcesController {
  @Get()
  async getSources(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    const subscriptionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      subscriptionParams
    );
    return getOrganizationSourcesForUser(
      localsToTokenOrKey(res),
      groupId,
      subscriptionParams
    );
  }

  @Put()
  async putSources(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate({ groupId: Joi.string().required() }, { groupId });
    await createOrganizationSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":sourceId")
  async getSource(req: Request, res: Response) {
    const groupId = await groupUsernameToId(req.params.id);
    const sourceId = req.params.sourceId;
    joiValidate(
      {
        groupId: Joi.string().required(),
        sourceId: Joi.string().required(),
      },
      { groupId, sourceId }
    );
    return getOrganizationSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      sourceId
    );
  }

  @Patch(":sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.string().required(),
        sourceId: Joi.string().required(),
      },
      { groupId, sourceId }
    );
    const updated = await updateOrganizationSourceForUser(
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
    const groupId = await groupUsernameToId(req.params.id);
    joiValidate(
      {
        groupId: Joi.string().required(),
        sourceId: Joi.string().required(),
      },
      { groupId, sourceId }
    );
    await deleteOrganizationSourceForUser(
      localsToTokenOrKey(res),
      groupId,
      sourceId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
