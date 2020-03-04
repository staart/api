import { UserRole } from "../../../interfaces/enum";
import { INVALID_TOKEN } from "@staart/errors";
import {
  sendPasswordReset,
  login,
  updatePassword,
  validateRefreshToken,
  impersonate,
  approveLocation,
  verifyEmail,
  register,
  login2FA,
  invalidateRefreshToken
} from "../../../rest/auth";
import { verifyToken } from "../../../helpers/jwt";
import {
  RESOURCE_CREATED,
  respond,
  RESOURCE_SUCCESS,
  RESOURCE_UPDATED
} from "@staart/messages";
import {
  Post,
  Controller,
  Middleware,
  Request,
  Response,
  ChildControllers
} from "@staart/server";
import {
  authHandler,
  bruteForceHandler,
  validator
} from "../../../helpers/middleware";
import { joiValidate, Joi } from "@staart/validate";
import { AuthOAuthController } from "./oauth";

@Controller("v1/auth")
@ChildControllers([new AuthOAuthController()])
export class AuthController {
  @Post("register")
  @Middleware(bruteForceHandler)
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
    return respond(RESOURCE_CREATED);
  }

  @Post("login")
  @Middleware(bruteForceHandler)
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
    return await login(req.body.email, req.body.password, res.locals);
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
    return await login2FA(code, token, res.locals);
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
  async postVerifyToken(req: Request) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const subject = req.body.subject;
    try {
      const data = await verifyToken(token, subject);
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
    return await validateRefreshToken(token, res.locals);
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
        password: Joi.string()
          .min(6)
          .required()
      },
      { token, password }
    );
    await updatePassword(token, password, res.locals);
    return respond(RESOURCE_UPDATED);
  }

  @Post("impersonate/:id")
  @Middleware(authHandler)
  @Middleware(
    validator({ impersonateUserId: Joi.string().required() }, "params")
  )
  async getImpersonate(req: Request, res: Response) {
    const tokenUserId = res.locals.token.id;
    const impersonateUserId = req.params.id;
    return await impersonate(tokenUserId, impersonateUserId, res.locals);
  }

  @Post("approve-location")
  async getApproveLocation(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    return await approveLocation(token, res.locals);
  }

  @Post("verify-email")
  async postVerifyEmail(req: Request, res: Response) {
    const token = req.body.token || req.params.token;
    joiValidate({ token: Joi.string().required() }, { token });
    await verifyEmail(token, res.locals);
    return respond(RESOURCE_SUCCESS);
  }
}
