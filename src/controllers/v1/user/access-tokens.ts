import {
  deleteAccessTokenForUser,
  updateAccessTokenForUser,
  getUserAccessTokenForUser,
  createAccessTokenForUser,
  getUserAccessTokensForUser
} from "../../../rest/user";
import {
  Get,
  Patch,
  Put,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response,
  Middleware
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import {
  RESOURCE_CREATED,
  respond,
  RESOURCE_UPDATED,
  RESOURCE_DELETED
} from "@staart/messages";
import { userUsernameToId } from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

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
        itemsPerPage: Joi.number()
      },
      accessTokenParams
    );
    return await getUserAccessTokensForUser(
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
        description: Joi.string()
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
        accessTokenId: Joi.string().required()
      },
      { id, accessTokenId }
    );
    return await getUserAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId
    );
  }

  @Patch(":accessTokenId")
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(),
        name: Joi.string().allow(),
        description: Joi.string().allow()
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
        accessTokenId: Joi.string().required()
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
        accessTokenId: Joi.string().required()
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
