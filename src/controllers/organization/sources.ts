import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_UPDATED,
  respond
} from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  Request,
  Response
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId
} from "../../helpers/utils";
import {
  createOrganizationSourceForUser,
  deleteOrganizationSourceForUser,
  getOrganizationSourceForUser,
  getOrganizationSourcesForUser,
  updateOrganizationSourceForUser
} from "../../rest/organization";

@Controller(":id/sources")
@ClassMiddleware(authHandler)
export class OrganizationSourcesController {
  @Get()
  async getSources(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    const subscriptionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      subscriptionParams
    );
    return getOrganizationSourcesForUser(
      localsToTokenOrKey(res),
      organizationId,
      subscriptionParams
    );
  }

  @Put()
  async putSources(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    await createOrganizationSourceForUser(
      localsToTokenOrKey(res),
      organizationId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":sourceId")
  async getSource(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    const sourceId = req.params.sourceId;
    joiValidate(
      {
        organizationId: Joi.string().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    return getOrganizationSourceForUser(
      localsToTokenOrKey(res),
      organizationId,
      sourceId
    );
  }

  @Patch(":sourceId")
  async patchSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.string().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    await updateOrganizationSourceForUser(
      localsToTokenOrKey(res),
      organizationId,
      sourceId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":sourceId")
  async deleteSource(req: Request, res: Response) {
    const sourceId = req.params.sourceId;
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      {
        organizationId: Joi.string().required(),
        sourceId: Joi.string().required()
      },
      { organizationId, sourceId }
    );
    await deleteOrganizationSourceForUser(
      localsToTokenOrKey(res),
      organizationId,
      sourceId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
