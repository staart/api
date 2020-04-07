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
import { userUsernameToId } from "../../helpers/utils";
import {
  createAccessTokenForUser,
  deleteAccessTokenForUser,
  getUserAccessTokenForUser,
  getUserAccessTokensForUser,
  updateAccessTokenForUser,
} from "../../rest/user";

@Controller(":id/access-tokens")
@ClassMiddleware(authHandler)
export class UserAccessTokensController {
  @Get()
  async getUserAccessTokens(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const accessTokenParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number(),
      },
      accessTokenParams
    );
    return getUserAccessTokensForUser(
      res.locals.token.id,
      id,
      accessTokenParams
    );
  }

  @Put()
  @Middleware(
    validator(
      {
        scopes: Joi.string(),
        name: Joi.string(),
        description: Joi.string(),
      },
      "body"
    )
  )
  async putUserAccessTokens(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await createAccessTokenForUser(
      res.locals.token.id,
      id,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":accessTokenId")
  async getUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required(),
      },
      { id, accessTokenId }
    );
    return getUserAccessTokenForUser(res.locals.token.id, id, accessTokenId);
  }

  @Patch(":accessTokenId")
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(),
        name: Joi.string().allow(),
        description: Joi.string().allow(),
      },
      "body"
    )
  )
  async patchUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required(),
      },
      { id, accessTokenId }
    );
    await updateAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":accessTokenId")
  async deleteUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required(),
      },
      { id, accessTokenId }
    );
    await deleteAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
