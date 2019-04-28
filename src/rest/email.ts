import { Locals } from "../interfaces/general";
import {
  createEmail,
  getEmail,
  getUserVerifiedEmails,
  getUserPrimaryEmailObject,
  deleteEmail
} from "../crud/email";
import { createEvent } from "../crud/event";
import { ErrorCode, EventType } from "../interfaces/enum";
import { updateUser } from "../crud/user";

export const addEmailToUser = async (
  userId: number,
  email: string,
  locals: Locals
) => {
  // Add email validation
  await createEmail({ email, userId });
  await createEvent(
    { userId, type: EventType.EMAIL_CREATED, data: { email } },
    locals
  );
  return;
};

export const deleteEmailFromUser = async (
  emailId: number,
  userId: number,
  locals: Locals
) => {
  const email = await getEmail(emailId);
  if (email.userId != userId)
    throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
  const verifiedEmails = await getUserVerifiedEmails(userId);
  if (verifiedEmails.length > 1) {
    const currentPrimaryEmailId = (await getUserPrimaryEmailObject(userId)).id;
    if (currentPrimaryEmailId == emailId) {
      const nextVerifiedEmail = verifiedEmails.filter(
        emailObject => emailObject.id != emailId
      )[0];
      await updateUser(userId, { primaryEmail: nextVerifiedEmail });
    }
  } else {
    throw new Error(ErrorCode.EMAIL_CANNOT_DELETE);
  }
  await deleteEmail(emailId);
  await createEvent(
    { userId, type: EventType.EMAIL_DELETED, data: { email: email.email } },
    locals
  );
  return;
};
