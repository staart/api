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
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId,
} from "../../../_staart/helpers/utils";
import {
  createWebhookForUser,
  deleteWebhookForUser,
  getOrganizationWebhookForUser,
  getOrganizationWebhooksForUser,
  updateWebhookForUser,
} from "../../../_staart/rest/organization";

@ClassMiddleware(authHandler)
export class OrganizationWebhooksController {
  @Get()
  async getOrganizationWebhooks(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return getOrganizationWebhooksForUser(
      localsToTokenOrKey(res),
      id,
      req.query
    );
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
  async putOrganizationWebhooks(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const added = await createWebhookForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":webhookId")
  async getOrganizationWebhook(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const webhookId = req.params.webhookId;
    joiValidate(
      {
        id: Joi.string().required(),
        webhookId: Joi.string().required(),
      },
      { id, webhookId }
    );
    return getOrganizationWebhookForUser(
      localsToTokenOrKey(res),
      id,
      webhookId
    );
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
  async patchOrganizationWebhook(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const webhookId = req.params.webhookId;
    joiValidate(
      {
        id: Joi.string().required(),
        webhookId: Joi.string().required(),
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
  async deleteOrganizationWebhook(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const webhookId = req.params.webhookId;
    joiValidate(
      {
        id: Joi.string().required(),
        webhookId: Joi.string().required(),
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
