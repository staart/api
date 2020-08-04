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
  Middleware,
  Patch,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  createApiKeyForUser,
  deleteApiKeyForUser,
  getGroupApiKeyForUser,
  getGroupApiKeyLogsForUser,
  getGroupApiKeysForUser,
  updateApiKeyForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupApiKeysController {
  @Get()
  async getUserApiKeys(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getGroupApiKeysForUser(localsToTokenOrKey(res), id, req.query);
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
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const added = await createApiKeyForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":apiKeyId")
  async getUserApiKey(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const apiKeyId = twtToId(req.params.apiKeyId);
    joiValidate(
      {
        id: Joi.number().required(),
        apiKeyId: Joi.number().required(),
      },
      { id, apiKeyId }
    );
    return getGroupApiKeyForUser(localsToTokenOrKey(res), id, apiKeyId);
  }

  @Patch(":apiKeyId")
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(null),
        ipRestrictions: Joi.string().allow(null),
        referrerRestrictions: Joi.string().allow(null),
        name: Joi.string().allow(null),
        description: Joi.string().allow(null),
      },
      "body"
    )
  )
  async patchUserApiKey(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const apiKeyId = twtToId(req.params.apiKeyId);
    joiValidate(
      {
        id: Joi.number().required(),
        apiKeyId: Joi.number().required(),
      },
      { id, apiKeyId }
    );
    const updated = await updateApiKeyForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyId,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":apiKeyId")
  async deleteUserApiKey(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const apiKeyId = twtToId(req.params.apiKeyId);
    joiValidate(
      {
        id: Joi.number().required(),
        apiKeyId: Joi.number().required(),
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
    const id = twtToId(req.params.id);
    const apiKeyId = twtToId(req.params.apiKeyId);
    joiValidate(
      {
        id: Joi.number().required(),
        apiKeyId: Joi.number().required(),
      },
      { id, apiKeyId }
    );
    return getGroupApiKeyLogsForUser(
      localsToTokenOrKey(res),
      id,
      apiKeyId,
      req.query
    );
  }
}
