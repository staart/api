import { INVALID_TOKEN } from "@staart/errors";
import {
  RESOURCE_CREATED,
  RESOURCE_SUCCESS,
  RESOURCE_UPDATED,
  respond,
} from "@staart/messages";
import { Middleware, Post, Request, Response } from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { verifyToken } from "../../_staart/helpers/jwt";
import {
  authHandler,
  bruteForceHandler,
  validator,
} from "../../_staart/helpers/middleware";
import {
  approveLocation,
  impersonate,
  invalidateRefreshToken,
  login,
  login2FA,
  register,
  resendEmailVerificationWithToken,
  sendPasswordReset,
  updatePassword,
  validateRefreshToken,
  verifyEmail,
  loginLink,
} from "../../_staart/rest/auth";
import { addInvitationCredits } from "../../_staart/rest/user";
import { twtToId } from "../../_staart/helpers/utils";

export class AuthController {
  @Post("register")
  @Middleware(bruteForceHandler)
  @Middleware(
    validator(
      {
        email: Joi.string().email().required(),
        name: Joi.string()
          .min(3)
          .regex(/^[a-zA-Z ]*$/)
          .required(),
        countryCode: Joi.string().length(2),
        password: Joi.string().min(6),
        gender: Joi.string().length(1),
        preferredLanguage: Joi.string().min(2).max(5),
        timezone: Joi.string(),
        invitedByUser: Joi.string().optional(),
      },
      "body"
    )
  )
  async register(req: Request, res: Response) {
    const user = req.body;
    const email = req.body.email;
    const invitedByUser = req.body.invitedByUser;
    delete user.groupId;
    delete user.email;
    delete user.invitedByUser;
    if (user.role === "ADMIN") delete user.role;
    delete user.membershipRole;
    const { userId, resendToken } = await register(
      user,
      res.locals,
      email,
      req.body.groupId,
      req.body.membershipRole
    );
    if (invitedByUser) await addInvitationCredits(invitedByUser, userId);
    return { ...respond(RESOURCE_CREATED), resendToken };
  }

  @Post("login")
  @Middleware(bruteForceHandler)
  @Middleware(
    validator(
      {
        email: Joi.string().email().required(),
        password: Joi.string().min(6).allow(""),
      },
      "body"
    )
  )
  async login(req: Request, res: Response) {
    return login(req.body.email, req.body.password, res.locals);
  }

  @Post("2fa")
  @Middleware(
    validator(
      {
        token: Joi.string().required(),
        code: Joi.number().min(5).required(),
      },
      "body"
    )
  )
  async twoFactor(req: Request, res: Response) {
    const code = req.body.code;
    const token = req.body.token;
    return login2FA(code, token, res.locals);
  }

  @Post("verify-token")
  @Middleware(
    validator(
      {
        token: Joi.string().required(),
        subject: Joi.string().required(),
      },
      "body"
    )
  )
  async postVerifyToken(req: Request) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const subject = req.body.subject;
    try {
      const data = await verifyToken<any>(token, subject);
      return { verified: true, data };
    } catch (error) {
      throw new Error(INVALID_TOKEN);
    }
  }

  @Post("refresh")
  async postRefreshToken(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    joiValidate({ token: Joi.string().required() }, { token });
    return validateRefreshToken(token, res.locals);
  }

  @Post("logout")
  async postLogout(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    joiValidate({ token: Joi.string().required() }, { token });
    await invalidateRefreshToken(token, res.locals);
    return respond(RESOURCE_SUCCESS);
  }

  @Post("reset-password/request")
  @Middleware(
    validator(
      {
        email: Joi.string().email().required(),
      },
      "body"
    )
  )
  async postResetPasswordRequest(req: Request, res: Response) {
    const email = req.body.email;
    await sendPasswordReset(email, res.locals);
    return respond(RESOURCE_SUCCESS);
  }

  @Post("reset-password/recover")
  async postResetPasswordRecover(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const password = req.body.password;
    joiValidate(
      {
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
      },
      { token, password }
    );
    await updatePassword(token, password, res.locals);
    return respond(RESOURCE_UPDATED);
  }
  @Post("resend-verification")
  @Middleware(
    validator(
      {
        token: Joi.string().required(),
      },
      "body"
    )
  )
  async resendEmail(req: Request, res: Response) {
    const token = req.body.token;
    await resendEmailVerificationWithToken(token);
    return respond(RESOURCE_UPDATED);
  }

  @Post("impersonate/:id")
  @Middleware(authHandler)
  @Middleware(
    validator({ impersonateUserId: Joi.number().required() }, "params")
  )
  async getImpersonate(req: Request, res: Response) {
    const tokenUserId = res.locals.token.id;
    const impersonateUserId = twtToId(req.params.id);
    return impersonate(tokenUserId, impersonateUserId, res.locals);
  }

  @Post("approve-location")
  async getApproveLocation(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    return approveLocation(token, res.locals);
  }

  @Post("verify-email")
  async postVerifyEmail(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    await verifyEmail(token, res.locals);
    return respond(RESOURCE_SUCCESS);
  }

  @Post("login-link")
  async postLoginLink(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    return loginLink(token, res.locals);
  }
}
