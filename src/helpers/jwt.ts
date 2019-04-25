import { sign, Secret } from "jsonwebtoken";
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

export const emailVerificationToken = async (id: number) =>
  generateToken({ id }, "7d", "email-verify");
