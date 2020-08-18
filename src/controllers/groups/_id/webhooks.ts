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
  createWebhookForUser,
  deleteWebhookForUser,
  getGroupWebhookForUser,
  getGroupWebhooksForUser,
  updateWebhookForUser,
} from "../../../_staart/rest/group";

@ClassMiddleware(authHandler)
export class GroupWebhooksController {
  @Get()
  async getGroupWebhooks(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getGroupWebhooksForUser(localsToTokenOrKey(res), id, req.query);
  }

  @Put()
  @Middleware(
    validator(
      {
        event: Joi.string().required(),
        url: Joi.string().uri().required(),
        contentType: Joi.string(),
        secret: Joi.string().allow(),
        isActive: Joi.boolean(),
      },
      "body"
    )
  )
  async putGroupWebhooks(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const added = await createWebhookForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":webhookId")
  async getGroupWebhook(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const webhookId = twtToId(req.params.webhookId);
    joiValidate(
      {
        id: Joi.number().required(),
        webhookId: Joi.number().required(),
      },
      { id, webhookId }
    );
    return getGroupWebhookForUser(localsToTokenOrKey(res), id, webhookId);
  }

  @Patch(":webhookId")
  @Middleware(
    validator(
      {
        event: Joi.string(),
        url: Joi.string().uri(),
        contentType: Joi.string(),
        secret: Joi.string(),
        isActive: Joi.boolean(),
      },
      "body"
    )
  )
  async patchGroupWebhook(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const webhookId = twtToId(req.params.webhookId);
    joiValidate(
      {
        id: Joi.number().required(),
        webhookId: Joi.number().required(),
      },
      { id, webhookId }
    );
    const updated = await updateWebhookForUser(
      localsToTokenOrKey(res),
      id,
      webhookId,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_UPDATED), updated };
  }

  @Delete(":webhookId")
  async deleteGroupWebhook(req: Request, res: Response) {
    const id = twtToId(req.params.id);
    const webhookId = twtToId(req.params.webhookId);
    joiValidate(
      {
        id: Joi.number().required(),
        webhookId: Joi.number().required(),
      },
      { id, webhookId }
    );
    await deleteWebhookForUser(
      localsToTokenOrKey(res),
      id,
      webhookId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
