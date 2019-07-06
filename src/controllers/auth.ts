import { Request, Response } from "express";
import { ErrorCode, UserRole } from "../interfaces/enum";
import { stringify } from "query-string";
import {
  sendPasswordReset,
  login,
  updatePassword,
  validateRefreshToken,
  loginWithGoogleLink,
  loginWithGoogleVerify,
  impersonate,
  approveLocation,
  verifyEmail,
  register,
  login2FA,
  github,
  githubCallback,
  facebook,
  facebookCallback,
  salesforceCallback,
  salesforce
} from "../rest/auth";
import { verifyToken } from "../helpers/jwt";
import {
  Get,
  Post,
  Controller,
  Middleware,
  ClassWrapper,
  ClassMiddleware
} from "@overnightjs/core";
import {
  authHandler,
  bruteForceHandler,
  validator
} from "../helpers/middleware";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { safeRedirect, joiValidate } from "../helpers/utils";
import Joi from "@hapi/joi";
import { KeyValue } from "../interfaces/general";
import { FRONTEND_URL, BASE_URL } from "../config";

@Controller("auth")
@ClassMiddleware(bruteForceHandler)
@ClassWrapper(asyncHandler)
export class AuthController {
  @Post("register")
  @Middleware(
    validator(
      {
        email: Joi.string()
          .email()
          .required(),
        name: Joi.string()
          .min(3)
          .regex(/^[a-zA-Z ]*$/)
          .required(),
        countryCode: Joi.string().length(2),
        password: Joi.string().min(6),
        gender: Joi.string().length(1),
        preferredLanguage: Joi.string()
          .min(2)
          .max(5),
        timezone: Joi.string()
      },
      "body"
    )
  )
  async register(req: Request, res: Response) {
    const email = req.body.email;
    const user = req.body;
    delete user.organizationId;
    delete user.email;
    if (user.role == UserRole.ADMIN) delete user.role;
    delete user.membershipRole;
    await register(
      user,
      res.locals,
      email,
      req.body.organizationId,
      req.body.membershipRole
    );
    res
      .status(CREATED)
      .json({ success: true, message: "auth-register-success" });
  }

  @Post("login")
  @Middleware(
    validator(
      {
        email: Joi.string()
          .email()
          .required(),
        password: Joi.string()
          .min(6)
          .required()
      },
      "body"
    )
  )
  async login(req: Request, res: Response) {
    res.json(await login(req.body.email, req.body.password, res.locals));
  }

  @Post("2fa")
  @Middleware(
    validator(
      {
        token: Joi.string().required(),
        code: Joi.number()
          .min(5)
          .required()
      },
      "body"
    )
  )
  async twoFactor(req: Request, res: Response) {
    const code = req.body.code;
    const token = req.body.token;
    res.json(await login2FA(code, token, res.locals));
  }

  @Post("verify-token")
  @Middleware(
    validator(
      {
        token: Joi.string().required(),
        subject: Joi.string().required()
      },
      "body"
    )
  )
  async postVerifyToken(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const subject = req.body.subject;
    try {
      const data = await verifyToken(token, subject);
      res.json({ verified: true, data });
    } catch (error) {
      throw new Error(ErrorCode.INVALID_TOKEN);
    }
  }

  @Post("refresh")
  @Middleware(authHandler)
  async postRefreshToken(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    joiValidate({ token: Joi.string().required() }, { token });
    res.json(await validateRefreshToken(token, res.locals));
  }

  @Post("reset-password/request")
  @Middleware(
    validator(
      {
        email: Joi.string()
          .email()
          .required()
      },
      "body"
    )
  )
  async postResetPasswordRequest(req: Request, res: Response) {
    const email = req.body.email;
    await sendPasswordReset(email, res.locals);
    res.json({ queued: true });
  }

  @Post("reset-password/recover")
  async postResetPasswordRecover(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const password = req.body.password;
    joiValidate(
      {
        token: Joi.string().required(),
        password: Joi.string()
          .min(6)
          .required()
      },
      { token, password }
    );
    await updatePassword(token, password, res.locals);
    res.json({ success: true, message: "auth-recover-success" });
  }

  @Get("google/link")
  async getLoginWithGoogleLink(req: Request, res: Response) {
    res.json({
      redirect: loginWithGoogleLink()
    });
  }

  @Post("google/verify")
  async postLoginWithGoogleVerify(req: Request, res: Response) {
    const code =
      req.body.code || (req.get("Authorization") || "").replace("Bearer ", "");
    joiValidate({ code: Joi.string().required() }, { code });
    res.json(await loginWithGoogleVerify(code, res.locals));
  }

  @Post("impersonate/:id")
  @Middleware(authHandler)
  async getImpersonate(req: Request, res: Response) {
    const tokenUserId = res.locals.token.id;
    const impersonateUserId = req.params.id;
    joiValidate(
      {
        tokenUserId: Joi.number().required(),
        impersonateUserId: Joi.number().required()
      },
      {
        tokenUserId,
        impersonateUserId
      }
    );
    res.json(await impersonate(tokenUserId, impersonateUserId));
  }

  @Post("approve-location")
  async getApproveLocation(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    res.json(await approveLocation(token, res.locals));
  }

  @Post("verify-email")
  async postVerifyEmail(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    await verifyEmail(token, res.locals);
    res.json({ success: true, message: "auth-verify-email-success" });
  }

  // OAuth2

  @Get("oauth/callback/:service")
  async oauthCallback(req: Request, res: Response) {
    const go = (token: KeyValue) =>
      safeRedirect(
        req,
        res,
        `${FRONTEND_URL}/auth/store?${stringify({ service, ...token })}`
      );
    const service = req.params.service;
    const code = `${BASE_URL}/auth${req.path}?${stringify(req.query)}`;
    if (service === "github") return go(await githubCallback(code, res.locals));
    if (service === "facebook")
      return go(await facebookCallback(code, res.locals));
    if (service === "salesforce")
      return go(await salesforceCallback(code, res.locals));
    safeRedirect(req, res, `${FRONTEND_URL}/errors/oauth`);
  }

  @Get("oauth/github")
  async oauthGitHub(req: Request, res: Response) {
    safeRedirect(req, res, github.code.getUri());
  }
  @Get("oauth/facebook")
  async oauthFacebook(req: Request, res: Response) {
    safeRedirect(req, res, facebook.code.getUri());
  }
  @Get("oauth/salesforce")
  async oauthSalesforce(req: Request, res: Response) {
    safeRedirect(req, res, salesforce.code.getUri());
  }
}
