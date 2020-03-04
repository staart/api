import {
  getUserFromId,
  updateUserForUser,
  getAllDataForUser,
  getRecentEventsForUser,
  deleteUserForUser,
  getMembershipsForUser,
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
  getUserSessionsForUser,
  getUserIdentitiesForUser,
  deleteIdentityForUser,
  getUserIdentityForUser,
  createUserIdentityForUser,
  connectUserIdentityForUser
} from "../../rest/user";
import {
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response,
  Middleware
} from "@staart/server";
import { authHandler, validator } from "../../helpers/middleware";
import {
  RESOURCE_CREATED,
  respond,
  RESOURCE_UPDATED,
  RESOURCE_DELETED,
  RESOURCE_SUCCESS
} from "@staart/messages";
import {
  getAllEmailsForUser,
  addEmailToUserForUser,
  deleteEmailFromUserForUser,
  getEmailForUser,
  resendEmailVerificationForUser
} from "../../rest/email";
import { userUsernameToId } from "../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";
import {
  deleteMembershipForUser,
  getMembershipDetailsForUser,
  updateMembershipForUser
} from "../../rest/membership";

@Controller("v1/users")
@ClassMiddleware(authHandler)
export class UserController {
  @Get(":id")
  async get(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getUserFromId(id, res.locals.token.id);
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
        primaryEmail: Joi.string(),
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
        profilePicture: Joi.string(),
        checkLocationOnLogin: Joi.boolean()
      },
      "body"
    )
  )
  async patch(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await updateUserForUser(res.locals.token.id, id, req.body, res.locals);
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":id")
  async delete(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await deleteUserForUser(res.locals.token.id, id, res.locals);
    return respond(RESOURCE_DELETED);
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
        id: Joi.string().required()
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
    return respond(RESOURCE_UPDATED);
  }

  @Get(":id/events")
  async getRecentEvents(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getRecentEventsForUser(res.locals.token.id, id, req.query);
  }

  @Get(":id/memberships")
  async getMemberships(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getMembershipsForUser(res.locals.token.id, id, req.query);
  }

  @Get(":id/memberships/:membershipId")
  async getMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { id, membershipId }
    );
    return await getMembershipDetailsForUser(id, membershipId);
  }

  @Delete(":id/memberships/:membershipId")
  async deleteMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { id, membershipId }
    );
    await deleteMembershipForUser(id, membershipId, res.locals);
    return respond(RESOURCE_DELETED);
  }

  @Patch(":id/memberships/:membershipId")
  async updateMembership(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const membershipId = req.params.membershipId;
    joiValidate(
      {
        id: Joi.string().required(),
        membershipId: Joi.string().required()
      },
      { id, membershipId }
    );
    const data = req.body;
    delete req.body.id;
    await updateMembershipForUser(id, membershipId, data, res.locals);
    return respond(RESOURCE_UPDATED);
  }

  @Get(":id/data")
  async getUserData(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getAllDataForUser(res.locals.token.id, id);
  }

  @Get(":id/emails")
  async getEmails(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getAllEmailsForUser(res.locals.token.id, id, req.query);
  }

  @Put(":id/emails")
  async putEmails(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const email = req.body.email;
    joiValidate(
      {
        id: Joi.string().required(),
        email: Joi.string()
          .email()
          .required()
      },
      { id, email }
    );
    await addEmailToUserForUser(res.locals.token.id, id, email, res.locals);
    return respond(RESOURCE_CREATED);
  }

  @Get(":id/emails/:emailId")
  async getEmail(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: Joi.string().required(),
        emailId: Joi.string().required()
      },
      { id, emailId }
    );
    return await getEmailForUser(res.locals.token.id, id, emailId);
  }

  @Post(":id/emails/:emailId/resend")
  async postResend(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: Joi.string().required(),
        emailId: Joi.string().required()
      },
      { id, emailId }
    );
    await resendEmailVerificationForUser(res.locals.token.id, id, emailId);
    return respond(RESOURCE_SUCCESS);
  }

  @Delete(":id/emails/:emailId")
  async deleteEmail(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const emailId = req.params.emailId;
    joiValidate(
      {
        id: Joi.string().required(),
        emailId: Joi.string().required()
      },
      { id, emailId }
    );
    await deleteEmailFromUserForUser(
      res.locals.token.id,
      id,
      emailId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }

  @Get(":id/2fa/enable")
  async getEnable2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await enable2FAForUser(res.locals.token.id, id);
  }

  @Post(":id/2fa/verify")
  async postVerify2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const code = req.body.code;
    joiValidate(
      {
        id: Joi.string().required(),
        code: Joi.number()
          .min(5)
          .required()
      },
      { id, code }
    );
    await verify2FAForUser(res.locals.token.id, id, code);
    return respond(RESOURCE_SUCCESS);
  }

  @Delete(":id/2fa")
  async delete2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await disable2FAForUser(res.locals.token.id, id);
    return respond(RESOURCE_SUCCESS);
  }

  @Get(":id/backup-codes")
  async getBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getBackupCodesForUser(res.locals.token.id, id);
  }

  @Get(":id/backup-codes/regenerate")
  async getRegenerateBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await regenerateBackupCodesForUser(res.locals.token.id, id);
  }

  @Get(":id/access-tokens")
  async getUserAccessTokens(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const accessTokenParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      accessTokenParams
    );
    return await getUserAccessTokensForUser(
      res.locals.token.id,
      id,
      accessTokenParams
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
    joiValidate({ id: Joi.string().required() }, { id });
    await createAccessTokenForUser(
      res.locals.token.id,
      id,
      req.body,
      res.locals
    );
    return respond(RESOURCE_CREATED);
  }

  @Get(":id/access-tokens/:accessTokenId")
  async getUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required()
      },
      { id, accessTokenId }
    );
    return await getUserAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId
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
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required()
      },
      { id, accessTokenId }
    );
    await updateAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId,
      req.body,
      res.locals
    );
    return respond(RESOURCE_UPDATED);
  }

  @Delete(":id/access-tokens/:accessTokenId")
  async deleteUserAccessToken(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const accessTokenId = req.params.accessTokenId;
    joiValidate(
      {
        id: Joi.string().required(),
        accessTokenId: Joi.string().required()
      },
      { id, accessTokenId }
    );
    await deleteAccessTokenForUser(
      res.locals.token.id,
      id,
      accessTokenId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }

  @Get(":id/sessions")
  async getUserSessions(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const sessionParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      sessionParams
    );
    return await getUserSessionsForUser(res.locals.token.id, id, sessionParams);
  }

  @Get(":id/sessions/:sessionId")
  async getUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required()
      },
      { id, sessionId }
    );
    return await getUserSessionForUser(res.locals.token.id, id, sessionId);
  }

  @Delete(":id/sessions/:sessionId")
  async deleteUserSession(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const sessionId = req.params.sessionId;
    joiValidate(
      {
        id: Joi.string().required(),
        sessionId: Joi.string().required()
      },
      { id, sessionId }
    );
    await deleteSessionForUser(res.locals.token.id, id, sessionId, res.locals);
    return respond(RESOURCE_DELETED);
  }

  @Get(":id/identities")
  async getUserIdentities(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const identityParams = { ...req.query };
    joiValidate(
      {
        start: Joi.string(),
        itemsPerPage: Joi.number()
      },
      identityParams
    );
    return await getUserIdentitiesForUser(
      res.locals.token.id,
      id,
      identityParams
    );
  }

  @Put(":id/identities")
  async createUserIdentity(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await createUserIdentityForUser(res.locals.token.id, id, req.body);
  }

  @Post(":id/identities/:service")
  async connectUserIdentity(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    const service = req.params.service;
    const url = req.body.url;
    joiValidate(
      { service: Joi.string().required(), url: Joi.string().required() },
      { service, url }
    );
    await connectUserIdentityForUser(res.locals.token.id, id, service, url);
    return respond(RESOURCE_SUCCESS);
  }

  @Get(":id/identities/:identityId")
  async getUserIdentity(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const identityId = req.params.identityId;
    joiValidate(
      {
        id: Joi.string().required(),
        identityId: Joi.string().required()
      },
      { id, identityId }
    );
    return await getUserIdentityForUser(res.locals.token.id, id, identityId);
  }

  @Delete(":id/identities/:identityId")
  async deleteUserIdentity(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    const identityId = req.params.identityId;
    joiValidate(
      {
        id: Joi.string().required(),
        identityId: Joi.string().required()
      },
      { id, identityId }
    );
    await deleteIdentityForUser(
      res.locals.token.id,
      id,
      identityId,
      res.locals
    );
    return respond(RESOURCE_DELETED);
  }
}
