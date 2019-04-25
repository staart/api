import { sign, verify } from "jsonwebtoken";
import { JWT_ISSUER, JWT_SECRET } from "../config";

export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: string | number,
  subject: string
) =>
  new Promise((resolve, reject) => {
    sign(
      payload,
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
  generateToken({ id }, "7d", "email-verify");
