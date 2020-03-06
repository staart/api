import {
  RESOURCE_CREATED,
  RESOURCE_DELETED,
  RESOURCE_SUCCESS,
  respond
} from "@staart/messages";
import {
  ClassMiddleware,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Request,
  Response
} from "@staart/server";
import { Joi, joiValidate } from "@staart/validate";
import { authHandler } from "../../../helpers/middleware";
import { userUsernameToId } from "../../../helpers/utils";
import {
  addEmailToUserForUser,
  deleteEmailFromUserForUser,
  getAllEmailsForUser,
  getEmailForUser,
  resendEmailVerificationForUser
} from "../../../rest/email";

@Controller(":id/emails")
@ClassMiddleware(authHandler)
export class UserEmailsController {
  @Get()
  async getEmails(req: Request, res: Response) {
    const id = await userUsernameToId(req.params.id, res.locals.token.id);
    joiValidate({ id: Joi.string().required() }, { id });
    return getAllEmailsForUser(res.locals.token.id, id, req.query);
  }

  @Put()
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

  @Get(":emailId")
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
    return getEmailForUser(res.locals.token.id, id, emailId);
  }

  @Post(":emailId/resend")
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

  @Delete(":emailId")
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
}
