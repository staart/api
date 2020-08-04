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
  Post,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import { twtToId, localsToTokenOrKey } from "../../../_staart/helpers/utils";
import {
  createDomainForUser,
  deleteDomainForUser,
  getGroupDomainForUser,
  getGroupDomainsForUser,
  updateDomainForUser,
  verifyDomainForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupDomainsController {
  @Get()
  async getUserDomains(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getGroupDomainsForUser(localsToTokenOrKey(res), id, req.query);
  }

  @Put()
  @Middleware(
    validator(
      {
        domain: Joi.string(),
      },
      "body"
    )
  )
  async putUserDomains(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const added = await createDomainForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":domainId")
  async getUserDomain(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const domainId = twtToId(req.params.domainId);
    joiValidate(
      {
        id: Joi.number().required(),
        domainId: Joi.number().required(),
      },
      { id, domainId }
    );
    return getGroupDomainForUser(localsToTokenOrKey(res), id, domainId);
  }

  @Patch(":domainId")
  @Middleware(
    validator(
      {
        domain: Joi.string(),
      },
      "body"
    )
  )
  async patchUserDomain(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const domainId = twtToId(req.params.domainId);
    joiValidate(
      {
        id: Joi.number().required(),
        domainId: Joi.number().required(),
      },
      { id, domainId }
    );
    const updated = await updateDomainForUser(
      localsToTokenOrKey(res),
      id,
      domainId,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":domainId")
  async deleteUserDomain(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const domainId = twtToId(req.params.domainId);
    joiValidate(
      {
        id: Joi.number().required(),
        domainId: Joi.number().required(),
      },
      { id, domainId }
    );
    await deleteDomainForUser(
      localsToTokenOrKey(res),
      id,
      domainId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }

  @Post(":domainId/verify")
  async verifyGroupDomain(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const domainId = twtToId(req.params.domainId);
    const method = req.body.method || req.query.method;
    joiValidate(
      {
        id: Joi.number().required(),
        domainId: Joi.number().required(),
        method: Joi.string().allow("file", "dns").only(),
      },
      { id, domainId, method }
    );
    return await verifyDomainForUser(
      localsToTokenOrKey(res),
      id,
      domainId,
      method,
      res.locals
    );
  }
}
