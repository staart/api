import {
  Controller,
  Get,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Wrapper
} from "@staart/server";
import { stringify } from "querystring";
import { BASE_URL, FRONTEND_URL } from "../../config";
import { LoginResponse } from "../../helpers/jwt";
import { safeRedirect } from "../../helpers/utils";
import { Tokens } from "../../interfaces/enum";
import {
  facebook,
  github,
  google,
  microsoft,
  salesforce
} from "../../rest/oauth";

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

@Controller("oauth")
export class AuthOAuthController {
  @Get("salesforce")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlSalesforce(req: Request, res: Response) {
    safeRedirect(req, res, salesforce.client.code.getUri());
  }
  @Get("salesforce/callback")
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

  @Get("github")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlGitHub(req: Request, res: Response) {
    safeRedirect(req, res, github.client.code.getUri());
  }
  @Get("github/callback")
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

  @Get("microsoft")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlMicrosoft(req: Request, res: Response) {
    safeRedirect(req, res, microsoft.client.code.getUri());
  }
  @Get("microsoft/callback")
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

  @Get("google")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlGoogle(req: Request, res: Response) {
    safeRedirect(req, res, google.client.code.getUri());
  }
  @Get("google/callback")
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

  @Get("facebook")
  @Wrapper(OAuthRedirector)
  async getOAuthUrlFacebook(req: Request, res: Response) {
    safeRedirect(req, res, facebook.client.code.getUri());
  }
  @Get("facebook/callback")
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
