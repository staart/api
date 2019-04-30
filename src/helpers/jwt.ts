import { sign, verify } from "jsonwebtoken";
import {
  JWT_ISSUER,
  JWT_SECRET,
  TOKEN_EXPIRY_EMAIL_VERIFICATION,
  TOKEN_EXPIRY_PASSWORD_RESET,
  TOKEN_EXPIRY_LOGIN,
  TOKEN_EXPIRY_REFRESH,
  TOKEN_EXPIRY_APPROVE_LOCATION
} from "../config";
import { User } from "../interfaces/tables/user";
import { Tokens, ErrorCode, EventType, Templates } from "../interfaces/enum";
import { deleteSensitiveInfoUser } from "./utils";
import { checkApprovedLocation } from "../crud/user";
import { Locals } from "../interfaces/general";
import { createEvent } from "../crud/event";
import { getUserVerifiedEmails, getUserPrimaryEmail } from "../crud/email";
import { mail } from "./mail";

export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: string | number,
  subject: string
) =>
  new Promise((resolve, reject) => {
    sign(
      // Payload is expected to be a plain object
      JSON.parse(JSON.stringify(payload)),
      JWT_SECRET,
      {
        expiresIn,
        subject,
        issuer: JWT_ISSUER
      },
      (error, token) => {
        if (error) return reject(error);
        resolve(token);
      }
    );
  });

export const verifyToken = (token: string, subject: string) =>
  new Promise((resolve, reject) => {
    verify(token, JWT_SECRET, { subject }, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });

export const emailVerificationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_EMAIL_VERIFICATION, Tokens.EMAIL_VERIFY);

export const passwordResetToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_PASSWORD_RESET, Tokens.PASSWORD_RESET);

export const loginToken = (user: User) =>
  generateToken(user, TOKEN_EXPIRY_LOGIN, Tokens.LOGIN);

export const approveLocationToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_APPROVE_LOCATION, Tokens.APPROVE_LOCATION);

export const refreshToken = (id: number) =>
  generateToken({ id }, TOKEN_EXPIRY_REFRESH, Tokens.REFRESH);

export const getLoginResponse = async (
  user: User,
  type?: EventType,
  strategy?: string,
  locals?: Locals
) => {
  if (!user.id) throw new Error(ErrorCode.USER_NOT_FOUND);
  const verifiedEmails = await getUserVerifiedEmails(user);
  if (!verifiedEmails.length) throw new Error(ErrorCode.UNVERIFIED_EMAIL);
  if (locals) {
    if (!(await checkApprovedLocation(user.id, locals.ipAddress))) {
      await mail(
        await getUserPrimaryEmail(user),
        Templates.UNAPPROVED_LOCATION,
        {
          ...user,
          token: await approveLocationToken(user.id)
        }
      );
      throw new Error(ErrorCode.UNAPPROVED_LOCATION);
    }
  }
  if (type && strategy && locals)
    await createEvent(
      {
        userId: user.id,
        type,
        data: { strategy }
      },
      locals
    );
  try {
    return {
      token: await loginToken(deleteSensitiveInfoUser(user)),
      refresh: await refreshToken(user.id)
    };
  } catch (error) {
    console.log("Got error 1", error);
    throw new Error(error);
  }
};
