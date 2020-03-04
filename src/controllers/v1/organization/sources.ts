import {
  getOrganizationSourcesForUser,
  getOrganizationSourceForUser,
  createOrganizationSourceForUser,
  updateOrganizationSourceForUser,
  deleteOrganizationSourceForUser
} from "../../../rest/organization";
import {
  RESOURCE_CREATED,
  respond,
  RESOURCE_UPDATED,
  RESOURCE_DELETED
} from "@staart/messages";
import {
  Get,
  Put,
  Patch,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response
} from "@staart/server";
import { authHandler } from "../../../helpers/middleware";
import {
  organizationUsernameToId,
  localsToTokenOrKey
} from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

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
    return await getOrganizationSourcesForUser(
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
    return await getOrganizationSourceForUser(
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
