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
  Middleware,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId,
} from "../../helpers/utils";
import {
  createApiKeyForUser,
  deleteApiKeyForUser,
  getOrganizationApiKeyForUser,
  getOrganizationApiKeyLogsForUser,
  getOrganizationApiKeysForUser,
  updateApiKeyForUser,
} from "../../rest/organization";

@Controller(":id/api-keys")
@ClassMiddleware(authHandler)
export class OrganizationApiKeysController {
  @Get()
  async getUserApiKeys(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const apiKeyParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      apiKeyParams
    );
    return getOrganizationApiKeysForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyParams
    );
  }

  @Put()
  @Middleware(
    validator(
      {
        scopes: Joi.string(),
        ipRestrictions: Joi.string(),
        referrerRestrictions: Joi.string(),
        name: Joi.string(),
        description: Joi.string(),
      },
      "body"
    )
  )
  async putUserApiKeys(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await createApiKeyForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":apiKeyId")
  async getUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: Joi.string().required(),
        apiKeyId: Joi.string().required(),
      },
      { id, apiKeyId }
    );
    return getOrganizationApiKeyForUser(localsToTokenOrKey(res), id, apiKeyId);
  }

  @Patch(":apiKeyId")
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(),
        ipRestrictions: Joi.string().allow(),
        referrerRestrictions: Joi.string().allow(),
        name: Joi.string().allow(),
        description: Joi.string().allow(),
      },
      "body"
    )
  )
  async patchUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: Joi.string().required(),
        apiKeyId: Joi.string().required(),
      },
      { id, apiKeyId }
    );
    await updateApiKeyForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":apiKeyId")
  async deleteUserApiKey(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: Joi.string().required(),
        apiKeyId: Joi.string().required(),
      },
      { id, apiKeyId }
    );
    await deleteApiKeyForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }

  @Get(":apiKeyId/logs")
  async getUserApiKeyLogs(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const apiKeyId = req.params.apiKeyId;
    joiValidate(
      {
        id: Joi.string().required(),
        apiKeyId: Joi.string().required(),
      },
      { id, apiKeyId }
    );
    return getOrganizationApiKeyLogsForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyId,
      req.query
    );
  }
}
