import { EMAIL_CANNOT_DELETE, INSUFFICIENT_PERMISSION } from "@staart/errors";
import { getPaginatedData } from "../crud/data";
import {
  checkIfNewEmail,
  createEmail,
  deleteEmail,
  getEmail,
  getUserPrimaryEmailObject,
  getUserVerifiedEmails,
  resendEmailVerification
} from "../crud/email";
import { updateUser } from "../crud/user";
import { can } from "../helpers/authorization";
import { addIsPrimaryToEmails } from "../helpers/mysql";
import { trackEvent } from "../helpers/tracking";
import { EventType, UserScopes } from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { Email } from "../interfaces/tables/emails";
import { ALLOW_DISPOSABLE_EMAILS } from "../config";
import { checkIfDisposableEmail } from "@staart/disposable-email";

export const getAllEmailsForUser = async (
  tokenUserId: string,
  userId: string,
  query: KeyValue
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_EMAILS, "user", userId)) {
    const emails = await getPaginatedData<Email>({
      table: "emails",
      conditions: { userId },
      ...query
    });
    emails.data = await addIsPrimaryToEmails(emails.data);
    return emails;
  }
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const getEmailForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string
) => {
  if (await can(tokenUserId, UserScopes.READ_USER_EMAILS, "user", userId))
    return getEmail(emailId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const resendEmailVerificationForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string
) => {
  if (
    await can(
      tokenUserId,
      UserScopes.RESEND_USER_EMAIL_VERIFICATION,
      "user",
      userId
    )
  )
    return resendEmailVerification(emailId);
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const addEmailToUserForUser = async (
  tokenUserId: string,
  userId: string,
  email: string,
  locals: Locals
) => {
  if (!(await can(tokenUserId, UserScopes.CREATE_USER_EMAILS, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  if (!ALLOW_DISPOSABLE_EMAILS) checkIfDisposableEmail(email);
  await checkIfNewEmail(email);
  await createEmail({ email, userId });
  trackEvent(
    { userId, type: EventType.EMAIL_CREATED, data: { email } },
    locals
  );
  return;
};

export const deleteEmailFromUserForUser = async (
  tokenUserId: string,
  userId: string,
  emailId: string,
  locals: Locals
) => {
  if (!(await can(tokenUserId, UserScopes.DELETE_USER_EMAILS, "user", userId)))
    throw new Error(INSUFFICIENT_PERMISSION);
  const email = await getEmail(emailId);
  if (email.userId != userId) throw new Error(INSUFFICIENT_PERMISSION);
  const verifiedEmails = await getUserVerifiedEmails(userId);
  if (verifiedEmails.length === 1 && email.isVerified)
    throw new Error(EMAIL_CANNOT_DELETE);
  const currentPrimaryEmailId = (await getUserPrimaryEmailObject(userId)).id;
  if (currentPrimaryEmailId == emailId) {
    const nextVerifiedEmail = verifiedEmails.filter(
      emailObject => emailObject.id != emailId
    )[0];
    await updateUser(userId, { primaryEmail: nextVerifiedEmail });
  }
  await deleteEmail(emailId);
  trackEvent(
    { userId, type: EventType.EMAIL_DELETED, data: { email: email.email } },
    locals
  );
  return;
};
