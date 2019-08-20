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
  updatePasswordForUser,
  deleteAccessTokenForUser,
  updateAccessTokenForUser,
  getUserAccessTokenForUser,
  createAccessTokenForUser,
  getUserAccessTokensForUser,
  deleteSessionForUser,
  getUserSessionForUser,
  getUserSessionsForUser
} from "../../rest/user";
import {
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Controller,
  ClassMiddleware,
  ClassWrapper,
  Middleware
} from "@overnightjs/core";
import { authHandler, validator } from "../../helpers/middleware";
import {
  getAllEmailsForUser,
  addEmailToUserForUser,
  deleteEmailFromUserForUser,
  getEmailForUser,
  resendEmailVerificationForUser
} from "../../rest/email";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { joiValidate, userUsernameToId } from "../../helpers/utils";
import Joi from "@hapi/joi";
import {
  deleteMembershipForUser,
  getMembershipDetailsForUser,
  updateMembershipForUser
} from "../../rest/membership";

@Controller("v1/users")
@ClassMiddleware(authHandler)
@ClassWrapper(asyncHandler)
export class UserController {
  @Get(":id")
  async get(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getUserFromId(id, res.locals.token.id));
  }

  @Patch(":id")
  @Middleware(
    validator(
      {
        name: Joi.string()
          .min(3)
          .regex(/^[a-zA-Z ]*$/),
        username: Joi.string().regex(/^[a-z0-9\-]+$/i),
        nickname: Joi.string(),
        primaryEmail: Joi.number(),
        countryCode: Joi.string().length(2),
        password: Joi.string().min(6),
        gender: Joi.string().length(1),
        preferredLanguage: Joi.string()
          .min(2)
          .max(5),
        timezone: Joi.string(),
        notificationEmails: Joi.number(),
        prefersReducedMotion: Joi.boolean(),
        prefersColorSchemeDark: Joi.boolean(),
        profilePicture: Joi.string()
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
    res.json({ success: true, message: "user-updated" });
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await deleteUserForUser(res.locals.token.id, id, res.locals));
  }

  @Put(":id/password")
  @Middleware(
    validator(
      {
        oldPassword: Joi.string()
          .min(6)
          .required(),
        newPassword: Joi.string()
          .min(6)
          .required()
      },
      "body"
    )
  )
  async updatePassword(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()]
      },
      { id }
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getRecentEventsForUser(res.locals.token.id, id, req.query));
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getMembershipsForUser(res.locals.token.id, id, req.query));
  }

  @Get(":id/memberships/:membershipId")
  async getMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = parseInt(req.params.membershipId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        membershipId: Joi.number().required()
      },
      { id, membershipId }
    );
    res.json(await getMembershipDetailsForUser(id, membershipId));
  }

  @Delete(":id/memberships/:membershipId")
  async deleteMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = parseInt(req.params.membershipId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        membershipId: Joi.number().required()
      },
      { id, membershipId }
    );
    await deleteMembershipForUser(id, membershipId, res.locals);
    res.json({ deleted: true });
  }

  @Patch(":id/memberships/:membershipId")
  async updateMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = parseInt(req.params.membershipId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        membershipId: Joi.number().required()
      },
      { id, membershipId }
    );
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(id, membershipId, data, res.locals);
    res.json({ success: true, message: "membership-updated" });
  }

  @Get(":id/data")
  async getUserData(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getAllDataForUser(res.locals.token.id, id));
  }

  @Get(":id/emails")
  async getEmails(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getAllEmailsForUser(res.locals.token.id, id, req.query));
  }

  @Put(":id/emails")
  async putEmails(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = parseInt(req.params.emailId);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = parseInt(req.params.emailId);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = parseInt(req.params.emailId);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getNotificationsForUser(res.locals.token.id, id));
  }

  @Patch(":id/notifications/:notificationId")
  async updateUserNotification(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const notificationId = parseInt(req.params.notificationId);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await enable2FAForUser(res.locals.token.id, id));
  }

  @Post(":id/2fa/verify")
  async postVerify2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
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
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await disable2FAForUser(res.locals.token.id, id));
  }

  @Get(":id/backup-codes")
  async getBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await getBackupCodesForUser(res.locals.token.id, id));
  }

  @Get(":id/backup-codes/regenerate")
  async getRegenerateBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res.json(await regenerateBackupCodesForUser(res.locals.token.id, id));
  }

  @Get(":id/access-tokens")
  async getUserAccessTokens(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    const accessTokenParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      accessTokenParams
    );
    res.json(
      await getUserAccessTokensForUser(
        res.locals.token.id,
        id,
        accessTokenParams
      )
    );
  }

  @Put(":id/access-tokens")
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
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    res
      .status(CREATED)
      .json(
        await createAccessTokenForUser(
          res.locals.token.id,
          id,
          req.body,
          res.locals
        )
      );
  }

  @Get(":id/access-tokens/:accessTokenId")
  async getUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = parseInt(req.params.accessTokenId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        accessTokenId: Joi.number().required()
      },
      { id, accessTokenId }
    );
    res.json(
      await getUserAccessTokenForUser(res.locals.token.id, id, accessTokenId)
    );
  }

  @Patch(":id/access-tokens/:accessTokenId")
  @Middleware(
    validator(
      {
        scopes: Joi.string().allow(""),
        name: Joi.string().allow(""),
        description: Joi.string().allow("")
      },
      "body"
    )
  )
  async patchUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = parseInt(req.params.accessTokenId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        accessTokenId: Joi.number().required()
      },
      { id, accessTokenId }
    );
    res.json(
      await updateAccessTokenForUser(
        res.locals.token.id,
        id,
        accessTokenId,
        req.body,
        res.locals
      )
    );
  }

  @Delete(":id/access-tokens/:accessTokenId")
  async deleteUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = parseInt(req.params.accessTokenId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        accessTokenId: Joi.number().required()
      },
      { id, accessTokenId }
    );
    res.json(
      await deleteAccessTokenForUser(
        res.locals.token.id,
        id,
        accessTokenId,
        res.locals
      )
    );
  }

  @Get(":id/sessions")
  async getUserSessions(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate(
      { id: [Joi.string().required(), Joi.number().required()] },
      { id }
    );
    const sessionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      sessionParams
    );
    res.json(
      await getUserSessionsForUser(res.locals.token.id, id, sessionParams)
    );
  }

  @Get(":id/sessions/:sessionId")
  async getUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = parseInt(req.params.sessionId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        sessionId: Joi.number().required()
      },
      { id, sessionId }
    );
    res.json(await getUserSessionForUser(res.locals.token.id, id, sessionId));
  }

  @Delete(":id/sessions/:sessionId")
  async deleteUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = parseInt(req.params.sessionId);
    joiValidate(
      {
        id: [Joi.string().required(), Joi.number().required()],
        sessionId: Joi.number().required()
      },
      { id, sessionId }
    );
    res.json(
      await deleteSessionForUser(res.locals.token.id, id, sessionId, res.locals)
    );
  }
}
