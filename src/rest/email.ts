import { Locals } from "../interfaces/general";
import {
  createEmail,
  getEmail,
  getUserVerifiedEmails,
  getUserPrimaryEmailObject,
  deleteEmail,
  checkIfNewEmail,
  resendEmailVerification
} from "../crud/email";
import { createEvent } from "../crud/event";
import { ErrorCode, EventType, Authorizations } from "../interfaces/enum";
import { updateUser } from "../crud/user";
import { can } from "../helpers/authorization";
import { getPaginatedData } from "../crud/data";
import { addIsPrimaryToEmails } from "../helpers/mysql";

export const getAllEmailsForUser = async (
  tokenUserId: number,
  userId: number,
  index?: number,
  itemsPerPage?: number
) => {
  if (await can(tokenUserId, Authorizations.READ, "user", userId)) {
    const emails = await getPaginatedData(
      "emails",
      { userId },
      index,
      itemsPerPage
    );
    emails.data = await addIsPrimaryToEmails(emails.data);
    return emails;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const getEmailForUser = async (
  tokenUserId: number,
  userId: number,
  emailId: number
) => {
  if (await can(tokenUserId, Authorizations.READ, "user", userId))
    return await getEmail(emailId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const resendEmailVerificationForUser = async (
  tokenUserId: number,
  userId: number,
  emailId: number
) => {
  if (await can(tokenUserId, Authorizations.UPDATE, "user", userId))
    return await resendEmailVerification(emailId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const addEmailToUserForUser = async (
  tokenUserId: number,
  userId: number,
  email: string,
  locals: Locals
) => {
  if (!(await can(tokenUserId, Authorizations.UPDATE, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  await checkIfNewEmail(email);
  await createEmail({ email, userId });
  await createEvent(
    { userId, type: EventType.EMAIL_CREATED, data: { email } },
    locals
  );
  return;
};

export const deleteEmailFromUserForUser = async (
  tokenUserId: number,
  userId: number,
  emailId: number,
  locals: Locals
) => {
  if (!(await can(tokenUserId, Authorizations.UPDATE, "user", userId)))
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const email = await getEmail(emailId);
  if (email.userId != userId)
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const verifiedEmails = await getUserVerifiedEmails(userId);
  if (verifiedEmails.length === 1 && email.isVerified)
    throw new Error(ErrorCode.EMAIL_CANNOT_DELETE);
  const currentPrimaryEmailId = (await getUserPrimaryEmailObject(userId)).id;
  if (currentPrimaryEmailId == emailId) {
    const nextVerifiedEmail = verifiedEmails.filter(
      emailObject => emailObject.id != emailId
    )[0];
    await updateUser(userId, { primaryEmail: nextVerifiedEmail });
  }
  await deleteEmail(emailId);
  await createEvent(
    { userId, type: EventType.EMAIL_DELETED, data: { email: email.email } },
    locals
  );
  return;
};
