import { Request, Response } from "express";
import {
  getUserFromId,
  updateUserForUser,
  getAllDataForUser,
  getRecentEventsForUser,
  deleteUserForUser,
  getMembershipsForUser,
  getNotificationsForUser,
  updateNotificationForUser,
  enable2FAForUser,
  disable2FAForUser,
  verify2FAForUser,
  getBackupCodesForUser,
  regenerateBackupCodesForUser,
  updatePasswordForUser
} from "../rest/user";
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
    res.json({ success: true, message: "user-updated" });
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

  @Put(":id/password")
  async updatePassword(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        oldPassword: Joi.string()
          .min(6)
          .required(),
        newPassword: Joi.string()
          .min(6)
          .required()
      },
      { id, oldPassword, newPassword }
    );
    await updatePasswordForUser(
      res.locals.token.id,
      id,
      oldPassword,
      newPassword,
      res.locals
    );
    res.json({ success: true, message: "user-password-updated" });
  }

  @Get(":id/events")
  async getRecentEvents(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getRecentEventsForUser(res.locals.token.id, id, req.query));
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getMembershipsForUser(res.locals.token.id, id, req.query));
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

  @Get(":id/emails")
  async getEmails(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getAllEmailsForUser(res.locals.token.id, id, req.query));
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
    res.status(CREATED).json({ success: true, message: "user-email-created" });
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
    res.json(await getEmailForUser(res.locals.token.id, id, emailId));
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
    res.json({ success: true, message: "user-email-verify-resent" });
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
    res.json({ success: true, message: "user-email-deleted" });
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

  @Get(":id/2fa/enable")
  async getEnable2FA(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await enable2FAForUser(res.locals.token.id, id));
  }

  @Post(":id/2fa/verify")
  async postVerify2FA(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    const code = req.body.code;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        code: Joi.number()
          .min(5)
          .required()
      },
      { id, code }
    );
    res.json(await verify2FAForUser(res.locals.token.id, id, code));
  }

  @Delete(":id/2fa")
  async delete2FA(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await disable2FAForUser(res.locals.token.id, id));
  }

  @Get(":id/backup-codes")
  async getBackupCodes(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getBackupCodesForUser(res.locals.token.id, id));
  }

  @Get(":id/backup-codes/regenerate")
  async getRegenerateBackupCodes(req: Request, res: Response) {
    let id = req.params.id;
    if (id === "me") id = res.locals.token.id;
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await regenerateBackupCodesForUser(res.locals.token.id, id));
  }
}
