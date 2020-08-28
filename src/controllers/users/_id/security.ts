import { RESOURCE_SUCCESS, RESOURCE_UPDATED, respond } from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Middleware,
  Post,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler, validator } from "../../../_staart/helpers/middleware";
import { twtToId } from "../../../_staart/helpers/utils";
import {
  disable2FAForUser,
  enable2FAForUser,
  getAllDataForUser,
  regenerateBackupCodesForUser,
  updatePasswordForUser,
  verify2FAForUser,
  getPasswordForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserSecurityController {
  @Put("password")
  @Middleware(
    validator(
      {
        oldPassword: Joi.string().allow("").optional(),
        newPassword: Joi.string().min(6).required(),
      },
      "body"
    )
  )
  async updatePassword(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    joiValidate(
      {
        id: Joi.number().required(),
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

  @Get("password")
  async getPassword(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getPasswordForUser(res.locals.token.id, id);
  }

  @Get("data")
  async getUserData(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getAllDataForUser(res.locals.token.id, id);
  }

  @Get("2fa/enable")
  async getEnable2FA(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return enable2FAForUser(res.locals.token.id, id);
  }

  @Post("2fa/verify")
  async postVerify2FA(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const code = req.body.code;
    joiValidate(
      {
        id: Joi.number().required(),
        code: Joi.number().min(5).required(),
      },
      { id, code }
    );
    const backupCodes = await verify2FAForUser(res.locals.token.id, id, code);
    return { ...respond(RESOURCE_SUCCESS), backupCodes };
  }

  @Delete("2fa")
  async delete2FA(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    await disable2FAForUser(res.locals.token.id, id);
    return respond(RESOURCE_SUCCESS);
  }

  @Get("backup-codes/regenerate")
  async getRegenerateBackupCodes(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    const backupCodes = await regenerateBackupCodesForUser(
      res.locals.token.id,
      id
    );
    return { ...respond(RESOURCE_SUCCESS), backupCodes };
  }
}
