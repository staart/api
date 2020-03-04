import {
  getOrganizationWebhooksForUser,
  createWebhookForUser,
  getOrganizationWebhookForUser,
  updateWebhookForUser,
  deleteWebhookForUser
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
  Response,
  Middleware
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import {
  organizationUsernameToId,
  localsToTokenOrKey
} from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

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
    return await getOrganizationWebhooksForUser(
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
    return await getOrganizationWebhookForUser(
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
