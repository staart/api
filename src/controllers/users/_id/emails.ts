import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_SUCCESS,
  respond,
} from "@staart/messages";
import {
  ClassMiddleware,
  Delete,
  Get,
  Post,
  Put,
  Request,
  Response,
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../_staart/helpers/middleware";
import { twtToId } from "../../../_staart/helpers/utils";
import {
  addEmailToUserForUser,
  deleteEmailFromUserForUser,
  getAllEmailsForUser,
  getEmailForUser,
  resendEmailVerificationForUser,
} from "../../../_staart/rest/user";

@ClassMiddleware(authHandler)
export class UserEmailsController {
  @Get()
  async getEmails(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.number().required() }, { id });
    return getAllEmailsForUser(res.locals.token.id, id, req.query);
  }

  @Put()
  async putEmails(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const email = req.body.email;
    joiValidate(
      {
        id: Joi.number().required(),
        email: Joi.string().email().required(),
      },
      { id, email }
    );
    const added = await addEmailToUserForUser(
      res.locals.token.id,
      id,
      email,
      res.locals
    );
    return { ...respond(RESOURCE_CREATED), added };
  }

  @Get(":emailId")
  async getEmail(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const emailId = twtToId(req.params.emailId);
    joiValidate(
      {
        id: Joi.number().required(),
        emailId: Joi.number().required(),
      },
      { id, emailId }
    );
    return getEmailForUser(res.locals.token.id, id, emailId);
  }

  @Post(":emailId/resend")
  async postResend(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const emailId = twtToId(req.params.emailId);
    joiValidate(
      {
        id: Joi.number().required(),
        emailId: Joi.number().required(),
      },
      { id, emailId }
    );
    await resendEmailVerificationForUser(res.locals.token.id, id, emailId);
    return respond(RESOURCE_SUCCESS);
  }

  @Delete(":emailId")
  async deleteEmail(req: Request, res: Response) {
    const id = twtToId(req.params.id, res.locals.token.id);
    const emailId = twtToId(req.params.emailId);
    joiValidate(
      {
        id: Joi.number().required(),
        emailId: Joi.number().required(),
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
}
