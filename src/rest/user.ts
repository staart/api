import {
  ErrorCode,
  MembershipRole,
  UserRole,
  EventType
} from "../interfaces/enum";
import { getUser, updateUser } from "../crud/user";
import {
  getUserOrganizationId,
  getUserMembershipObject
} from "../crud/membership";
import {
  createEmail,
  deleteEmail,
  getEmail,
  getUserVerifiedEmails,
  getUserPrimaryEmail,
  getUserPrimaryEmailObject
} from "../crud/email";
import { Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";

export const getUserFromId = async (userId: number, tokenId: number) => {
  const user = await getUser(userId);
  // You can access this user if:
  // (i) You're the user
  if (userId == tokenId) return user;
  // (ii) You're a super-admin
  const tokenUser = await getUser(tokenId);
  if (tokenUser.role == UserRole.ADMIN) return user;
  // You're both in the same organization
  const tokenOrganization = await getUserMembershipObject(tokenUser);
  const userOrganizationId = await getUserOrganizationId(user);
  // and you're not a basic member
  if (
    tokenOrganization.organizationId == userOrganizationId &&
    tokenOrganization.role !== MembershipRole.BASIC
  )
    return user;
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

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
