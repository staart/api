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
  Middleware,
  Patch,
  Put,
  Request,
  Response
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../helpers/middleware";
import {
  localsToTokenOrKey,
  organizationUsernameToId
} from "../../helpers/utils";
import {
  createWebhookForUser,
  deleteWebhookForUser,
  getOrganizationWebhookForUser,
  getOrganizationWebhooksForUser,
  updateWebhookForUser
} from "../../rest/organization";

@Controller(":id/webhooks")
@ClassMiddleware(authHandler)
export class OrganizationWebhooksController {
  @Get()
  async getOrganizationWebhooks(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const webhookParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      webhookParams
    );
    return getOrganizationWebhooksForUser(
      localsToTokenOrKey(res),
      id,
      webhookParams
    );
  }

  @Put()
  @Middleware(
    validator(
      {
        event: Joi.string().required(),
        url: Joi.string().required(),
        contentType: Joi.string(),
        secret: Joi.string().allow(),
        isActive: Joi.boolean()
      },
      "body"
    )
  )
  async putOrganizationWebhooks(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await createWebhookForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":webhookId")
  async getOrganizationWebhook(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const webhookId = req.params.webhookId;
    joiValidate(
      {
        id: Joi.string().required(),
        webhookId: Joi.string().required()
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
        url: Joi.string(),
        contentType: Joi.string(),
        secret: Joi.string(),
        isActive: Joi.boolean()
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
        webhookId: Joi.string().required()
      },
      { id, webhookId }
    );
    await updateWebhookForUser(
      localsToTokenOrKey(res),
      id,
      webhookId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":webhookId")
  async deleteOrganizationWebhook(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    const webhookId = req.params.webhookId;
    joiValidate(
      {
        id: Joi.string().required(),
        webhookId: Joi.string().required()
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
