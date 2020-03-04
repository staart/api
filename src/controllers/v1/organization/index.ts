import {
  newOrganizationForUser,
  updateOrganizationForUser,
  deleteOrganizationForUser,
  getOrganizationForUser,
  getAllOrganizationDataForUser
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
  Middleware,
  ChildControllers
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import {
  organizationUsernameToId,
  localsToTokenOrKey
} from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";
import { OrganizationApiKeysController } from "./api-keys";
import { OrganizationBillingController } from "./billing";
import { OrganizationDomainsController } from "./domains";
import { OrganizationInvoicesController } from "./invoices";
import { OrganizationMembershipsController } from "./memberships";
import { OrganizationSourcesController } from "./sources";
import { OrganizationSubscriptionsController } from "./subscriptions";
import { OrganizationWebhooksController } from "./webhooks";

@Controller("v1/organizations")
@ChildControllers([
  new OrganizationApiKeysController(),
  new OrganizationBillingController(),
  new OrganizationDomainsController(),
  new OrganizationInvoicesController(),
  new OrganizationMembershipsController(),
  new OrganizationSourcesController(),
  new OrganizationSubscriptionsController(),
  new OrganizationWebhooksController()
])
@ClassMiddleware(authHandler)
export class OrganizationController {
  @Put()
  @Middleware(
    validator(
      {
        name: Joi.string().required()
      },
      "body"
    )
  )
  async put(req: Request, res: Response) {
    await newOrganizationForUser(res.locals.token.id, req.body, res.locals);
    return respond(RESOURCE_CREATED);
  }

  @Get(":id")
  async get(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const organization = await getOrganizationForUser(
      localsToTokenOrKey(res),
      id
    );
    return organization;
  }

  @Patch(":id")
  @Middleware(
    validator(
      {
        name: Joi.string(),
        username: Joi.string().regex(/^[a-z0-9\-]+$/i),
        forceTwoFactor: Joi.boolean(),
        autoJoinDomain: Joi.boolean(),
        onlyAllowDomain: Joi.boolean(),
        ipRestrictions: Joi.string(),
        profilePicture: Joi.string()
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = await organizationUsernameToId(req.params.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await updateOrganizationForUser(
      localsToTokenOrKey(res),
      id,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED, { resource: "Team" });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    await deleteOrganizationForUser(
      res.locals.token.id,
      organizationId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }

  @Get(":id/data")
  async getData(req: Request, res: Response) {
    const organizationId = await organizationUsernameToId(req.params.id);
    joiValidate(
      { organizationId: Joi.string().required() },
      { organizationId }
    );
    return await getAllOrganizationDataForUser(
      localsToTokenOrKey(res),
      organizationId
    );
  }
}
