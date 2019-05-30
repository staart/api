import { Request, Response } from "express";
import {
  getUserFromId,
  updateUserForUser,
  getAllDataForUser,
  getRecentEventsForUser,
  deleteUserForUser,
  getMembershipsForUser,
  getApiKeysForUser,
  createApiKeyForUser,
  getApiKeyForUser,
  updateApiKeyForUser,
  deleteApiKeyForUser,
  getNotificationsForUser,
  updateNotificationForUser
} from "../rest/user";
import { ErrorCode } from "../interfaces/enum";
import {
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Controller,
  ClassMiddleware,
  ClassWrapper
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import {
  getAllEmailsForUser,
  addEmailToUserForUser,
  deleteEmailFromUserForUser,
  getEmailForUser,
  resendEmailVerificationForUser
} from "../rest/email";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { joiValidate } from "../helpers/utils";
import Joi from "@hapi/joi";

@Controller("users")
@ClassMiddleware(authHandler)
@ClassWrapper(asyncHandler)
export class UserController {
  @Get(":id")
  async get(req: Request, res: Response) {
    let id = req.body.id || req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getUserFromId(id, res.locals.token.id));
  }

  @Patch(":id")
  async patch(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
    res.json({ success: true });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await deleteUserForUser(res.locals.token.id, id, res.locals));
  }

  @Get(":id/events")
  async getRecentEvents(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getRecentEventsForUser(res.locals.token.id, id));
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getMembershipsForUser(res.locals.token.id, id));
  }

  @Get(":id/data")
  async getUserData(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getAllDataForUser(res.locals.token.id, id));
  }

  @Get(":id/api-keys")
  async getUserApiKeys(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getApiKeysForUser(res.locals.token.id, id));
  }

  @Put(":id/api-keys")
  async putUserApiKeys(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res
      .status(CREATED)
      .json(await createApiKeyForUser(res.locals.token.id, id, res.locals));
  }

  @Get(":id/api-keys/:apiKey")
  async getUserApiKey(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const apiKey = req.params.apiKey;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKey: Joi.string().required()
      },
      { id, apiKey }
    );
    res.json(await getApiKeyForUser(res.locals.token.id, id, apiKey));
  }

  @Patch(":id/api-keys/:apiKey")
  async patchUserApiKey(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const apiKey = req.params.apiKey;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKey: Joi.string().required()
      },
      { id, apiKey }
    );
    res.json(
      await updateApiKeyForUser(
        res.locals.token.id,
        id,
        apiKey,
        req.body,
        res.locals
      )
    );
  }

  @Delete(":id/api-keys/:apiKey")
  async deleteUserApiKey(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const apiKey = req.params.apiKey;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        apiKey: Joi.string().required()
      },
      { id, apiKey }
    );
    res.json(
      await deleteApiKeyForUser(res.locals.token.id, id, apiKey, res.locals)
    );
  }

  @Get(":id/emails")
  async getEmails(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getAllEmailsForUser(res.locals.token.id, id));
  }

  @Put(":id/emails")
  async putEmails(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const email = req.body.email;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        email: Joi.string()
          .email()
          .required()
      },
      { id, email }
    );
    await addEmailToUserForUser(res.locals.token.id, id, email, res.locals);
    res.status(CREATED).json({ success: true });
  }

  @Get(":id/emails/:emailId")
  async getEmail(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        emailId: Joi.number().required()
      },
      { id, emailId }
    );
    await getEmailForUser(res.locals.token.id, id, emailId);
    res.json({ success: true });
  }

  @Post(":id/emails/:emailId/resend")
  async postResend(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        emailId: Joi.number().required()
      },
      { id, emailId }
    );
    await resendEmailVerificationForUser(res.locals.token.id, id, emailId);
    res.json({ success: true });
  }

  @Delete(":id/emails/:emailId")
  async deleteEmail(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        emailId: Joi.number().required()
      },
      { id, emailId }
    );
    await deleteEmailFromUserForUser(
      res.locals.token.id,
      id,
      emailId,
      res.locals
    );
    res.json({ success: true });
  }

  @Get(":id/notifications")
  async getUserNotifications(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getNotificationsForUser(res.locals.token.id, id));
  }

  @Patch(":id/notifications/:notificationId")
  async updateUserNotification(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const notificationId = req.params.notificationId;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        notificationId: Joi.number().required()
      },
      { id, notificationId }
    );
    res.json(
      await updateNotificationForUser(
        res.locals.token.id,
        id,
        notificationId,
        req.body
      )
    );
  }
}
