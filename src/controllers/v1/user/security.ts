import {
  getAllDataForUser,
  getRecentEventsForUser,
  enable2FAForUser,
  disable2FAForUser,
  verify2FAForUser,
  getBackupCodesForUser,
  regenerateBackupCodesForUser,
  updatePasswordForUser
} from "../../../rest/user";
import {
  Get,
  Post,
  Put,
  Delete,
  Controller,
  ClassMiddleware,
  Request,
  Response,
  Middleware
} from "@staart/server";
import { authHandler, validator } from "../../../helpers/middleware";
import { respond, RESOURCE_UPDATED, RESOURCE_SUCCESS } from "@staart/messages";
import { userUsernameToId } from "../../../helpers/utils";
import { joiValidate, Joi } from "@staart/validate";

@Controller(":id")
@ClassMiddleware(authHandler)
export class UserSecurityController {
  @Put("password")
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

  @Get("events")
  async getRecentEvents(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getRecentEventsForUser(res.locals.token.id, id, req.query);
  }

  @Get("data")
  async getUserData(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getAllDataForUser(res.locals.token.id, id);
  }

  @Get("2fa/enable")
  async getEnable2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await enable2FAForUser(res.locals.token.id, id);
  }

  @Post("2fa/verify")
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

  @Delete("2fa")
  async delete2FA(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    await disable2FAForUser(res.locals.token.id, id);
    return respond(RESOURCE_SUCCESS);
  }

  @Get("backup-codes")
  async getBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await getBackupCodesForUser(res.locals.token.id, id);
  }

  @Get("backup-codes/regenerate")
  async getRegenerateBackupCodes(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return await regenerateBackupCodesForUser(res.locals.token.id, id);
  }
}
