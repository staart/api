import { Request, Response } from "express";
import { ErrorCode, UserRole } from "../interfaces/enum";
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
  register
} from "../rest/auth";
import { verifyToken } from "../helpers/jwt";
import {
  Get,
  Post,
  Controller,
  Middleware,
  ClassWrapper
} from "@overnightjs/core";
import { authHandler } from "../helpers/middleware";
import { CREATED } from "http-status-codes";
import asyncHandler from "express-async-handler";

@Controller("auth")
@ClassWrapper(asyncHandler)
export class AuthController {
  @Post("register")
  async register(req: Request, res: Response) {
    const email = req.body.email;
    const user = req.body;
    delete user.organizationId;
    delete user.email;
    if (user.role == UserRole.ADMIN) delete user.role;
    delete user.membershipRole;
    if (!req.body.name || !email) throw new Error(ErrorCode.MISSING_FIELD);
    await register(
      user,
      res.locals,
      email,
      req.body.organizationId,
      req.body.membershipRole
    );
    res.status(CREATED).json({ success: true });
  }

  @Post("login")
  async login(req: Request, res: Response) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await login(email, password, res.locals));
  }

  @Post("verify-token")
  @Middleware(authHandler)
  async postVerifyToken(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const subject = req.body.subject;
    if (!token || !subject) throw new Error(ErrorCode.MISSING_FIELD);
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
    if (!token) throw new Error(ErrorCode.MISSING_TOKEN);
    res.json(await validateRefreshToken(token, res.locals));
  }

  @Post("reset-password/request")
  async postResetPasswordRequest(req: Request, res: Response) {
    const email = req.body && req.body.email;
    if (!email) throw new Error(ErrorCode.MISSING_FIELD);
    await sendPasswordReset(email, res.locals);
    res.json({ queued: true });
  }

  @Post("reset-password/recover")
  async postResetPasswordRecover(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    const password = req.body.password;
    if (!token || !password) throw new Error(ErrorCode.MISSING_FIELD);
    await updatePassword(token, password, res.locals);
    res.json({ success: true });
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
    if (!code) throw new Error(ErrorCode.MISSING_TOKEN);
    res.json(await loginWithGoogleVerify(code, res.locals));
  }

  @Post("impersonate/:id")
  @Middleware(authHandler)
  async getImpersonate(req: Request, res: Response) {
    const tokenUserId = res.locals.token.id;
    const impersonateUserId = req.params.id;
    if (!tokenUserId || !impersonateUserId)
      throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await impersonate(tokenUserId, impersonateUserId));
  }

  @Get("approve-location")
  @Middleware(authHandler)
  async getApproveLocation(req: Request, res: Response) {
    const token =
      req.body.token || (req.get("Authorization") || "").replace("Bearer ", "");
    if (!token) throw new Error(ErrorCode.MISSING_FIELD);
    res.json(await approveLocation(token, res.locals));
  }

  @Get("verify-email")
  async postVerifyEmail(req: Request, res: Response) {
    await verifyEmail(req.body.token || req.params.token, res.locals);
    res.json({ success: true });
  }
}
