import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_SUCCESS,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Post,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId } from "../../../_staart/helpers/utils";
import {
  connectUserIdentityForUser,
  createUserIdentityForUser,
  deleteIdentityForUser,
  getUserIdentitiesForUser,
  getUserIdentityForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserIdentitiesController {
  @Get()
  async getUserIdentities(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getUserIdentitiesForUser(
      twtToId(res.locals.token.id),
      id,
      req.query
    );
  }

  @Put()
  async createUserIdentity(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const added = await createUserIdentityForUser(
      twtToId(res.locals.token.id),
      id,
      req.body
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Post(":service")
  async connectUserIdentity(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const service = req.params.service;
    const url = req.body.url;
    joiValidate(
      { service: Joi.string().required(), url: Joi.string().required() },
      { service, url }
    );
    await connectUserIdentityForUser(
      twtToId(res.locals.token.id),
      id,
      service,
      url
    );
    return respond(RESOURCE_SUCCESS);
  }

  @Get(":identityId")
  async getUserIdentity(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const identityId = twtToId(req.params.identityId);
    joiValidate(
      {
        id: Joi.number().required(),
        identityId: Joi.number().required(),
      },
      { id, identityId }
    );
    return getUserIdentityForUser(twtToId(res.locals.token.id), id, identityId);
  }

  @Delete(":identityId")
  async deleteUserIdentity(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const identityId = twtToId(req.params.identityId);
    joiValidate(
      {
        id: Joi.number().required(),
        identityId: Joi.number().required(),
      },
      { id, identityId }
    );
    await deleteIdentityForUser(
      twtToId(res.locals.token.id),
      id,
      identityId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
