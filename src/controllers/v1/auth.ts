import { Request, Response, NextFunction, RequestHandler } from "express";
import { ErrorCode, UserRole, Tokens } from "../../interfaces/enum";
import {
  sendPasswordReset,
  login,
  updatePassword,
  validateRefreshToken,
  impersonate,
  approveLocation,
  verifyEmail,
  register,
  login2FA
} from "../../rest/auth";
import { verifyToken, LoginResponse } from "../../helpers/jwt";
import {
  Get,
  Post,
  Controller,
  Middleware,
  ClassWrapper,
  ClassMiddleware,
  Wrapper
} from "@overnightjs/core";
import {
  authHandler,
  bruteForceHandler,
  validator
} from "../../helpers/middleware";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";
import { safeRedirect, joiValidate } from "../../helpers/utils";
import Joi from "@hapi/joi";
import { FRONTEND_URL, BASE_URL } from "../../config";
import {
  salesforce,
  github,
  microsoft,
  google,
  facebook
} from "../../rest/oauth";
import { stringify } from "querystring";

const OAuthRedirector = (action: RequestHandler) => (
  ...args: [Request, Response, NextFunction]
) => {
  return action(args[0], args[1], (error: Error) => {
    safeRedirect(
      args[0],
      args[1],
      `${FRONTEND_URL}/errors/oauth?${stringify({
        ...args[0].params,
        ...args[0].query,
        error: error.toString().replace("Error: ", "")
      })}`
    );
  });
};
const OAuthRedirect = (
  req: Request,
  res: Response,
  response: LoginResponse
) => {
  return safeRedirect(
    req,
    res,
    `${FRONTEND_URL}/auth/token?${stringify({
      ...response,
      subject: Tokens.LOGIN
    })}`
  );
};

@Controller("v1/auth")
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

  @Post("impersonate/:id")
  @Middleware(authHandler)
  @Middleware(
    validator({ impersonateUserId: Joi.number().required() }, "params")
  )
  async getImpersonate(req: Request, res: Response) {
    const tokenUserId = res.locals.token.id;
    const impersonateUserId = parseInt(req.params.id);
    res.json(await impersonate(tokenUserId, impersonateUserId, res.locals));
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

  @Get("oauth/salesforce")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlSalesforce(req: Request, res: Response) {
    safeRedirect(req, res, salesforce.client.code.getUri());
  }
  @Get("oauth/salesforce/callback")
  @Wrapper(OAuthRedirector)
  async getOAuthCallbackSalesforce(req: Request, res: Response) {
    return OAuthRedirect(
      req,
      res,
      await salesforce.callback(
        `${BASE_URL}/auth${req.path}?${stringify(req.query)}`,
        res.locals
      )
    );
  }

  @Get("oauth/github")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlGitHub(req: Request, res: Response) {
    safeRedirect(req, res, github.client.code.getUri());
  }
  @Get("oauth/github/callback")
  @Wrapper(OAuthRedirector)
  async getOAuthCallbackGitHub(req: Request, res: Response) {
    return OAuthRedirect(
      req,
      res,
      await github.callback(
        `${BASE_URL}/auth${req.path}?${stringify(req.query)}`,
        res.locals
      )
    );
  }

  @Get("oauth/microsoft")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlMicrosoft(req: Request, res: Response) {
    safeRedirect(req, res, microsoft.client.code.getUri());
  }
  @Get("oauth/microsoft/callback")
  @Wrapper(OAuthRedirector)
  async getOAuthCallbackMicrosoft(req: Request, res: Response) {
    return OAuthRedirect(
      req,
      res,
      await microsoft.callback(
        `${BASE_URL}/auth${req.path}?${stringify(req.query)}`,
        res.locals
      )
    );
  }

  @Get("oauth/google")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlGoogle(req: Request, res: Response) {
    safeRedirect(req, res, google.client.code.getUri());
  }
  @Get("oauth/google/callback")
  @Wrapper(OAuthRedirector)
  async getOAuthCallbackGoogle(req: Request, res: Response) {
    return OAuthRedirect(
      req,
      res,
      await google.callback(
        `${BASE_URL}/auth${req.path}?${stringify(req.query)}`,
        res.locals
      )
    );
  }

  @Get("oauth/facebook")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlFacebook(req: Request, res: Response) {
    safeRedirect(req, res, facebook.client.code.getUri());
  }
  @Get("oauth/facebook/callback")
  @Wrapper(OAuthRedirector)
  async getOAuthCallbackFacebook(req: Request, res: Response) {
    return OAuthRedirect(
      req,
      res,
      await facebook.callback(
        `${BASE_URL}/auth${req.path}?${stringify(req.query)}`,
        res.locals
      )
    );
  }
}
