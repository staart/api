import { EXPIRED_TOKEN, INVALID_TOKEN } from "@staart/errors";
import { HTTPError } from "../interfaces/general";
import { ValidationError } from "@hapi/joi";
import { error, warn } from "signale";

/**
 * Parse default errors and send a safe string
 */
export const safeError = (error: string) => {
  let errorString = error.toString();
  if (errorString.startsWith("Error: "))
    errorString = errorString.replace("Error: ", "");
  if (errorString.startsWith("joi:")) {
    const joiError = JSON.parse(
      errorString.split("joi:")[1]
    ) as ValidationError;
    return sendError(`422/${joiError.details[0].message}`);
  }
  if (errorString === "TokenExpiredError: jwt expired")
    return sendError(EXPIRED_TOKEN);
  if (
    errorString.startsWith("JsonWebTokenError") ||
    errorString.startsWith("JsonWebTokenjwt")
  )
    return sendError(INVALID_TOKEN);
  return sendError(errorString);
};

/**
 * Send an HTTPError object
 */
export const sendError = (error: string) => {
  if (error.includes("/")) {
    let status = parseInt(error.split("/")[0]);
    if (isNaN(status)) status = 500;
    const code = error.split("/")[1];
    return { status, code } as HTTPError;
  }
  warn(error);
  return { status: 500, code: error } as HTTPError;
};

export const logError = (category: string, err: string, level: 1 | 2 = 2) => {
  if (level === 1) return error(`${category}: ${err}`);
  warn(`${category}: ${err}`);
};
