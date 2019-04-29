import { sign, verify } from "jsonwebtoken";
import { JWT_ISSUER, JWT_SECRET } from "../config";
import { User } from "../interfaces/tables/user";
import { Tokens } from "../interfaces/enum";

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
  generateToken({ id }, "7d", Tokens.EMAIL_VERIFY);

export const passwordResetToken = (id: number) =>
  generateToken({ id }, "1d", Tokens.PASSWORD_RESET);

export const loginToken = (user: User) =>
  generateToken(user, "1d", Tokens.LOGIN);

export const refreshToken = (id: number) =>
  generateToken({ id }, "30d", Tokens.REFRESH);
