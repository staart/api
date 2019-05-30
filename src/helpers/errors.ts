import { ErrorCode } from "../interfaces/enum";
import { HTTPError } from "../interfaces/general";
import Joi from "@hapi/joi";

/**
 * Parse default errors and send a safe string
 */
export const safeError = (error: string) => {
  const errorString = error.toString();
  if (errorString.startsWith("joi:")) {
    const joiError = JSON.parse(
      errorString.split("joi:")[1]
    ) as Joi.ValidationError;
    return sendError(`422/${joiError.details[0].message}`);
  }
  if (errorString.startsWith("JsonWebTokenError"))
    return sendError(ErrorCode.INVALID_TOKEN);
  return sendError(error);
};

/**
 * Send an HTTPError object
 */
export const sendError = (error: string) => {
  if (error.includes("/")) {
    const status = parseInt(error.split("/")[0]);
    const code = error.split("/")[1];
    return { status, code } as HTTPError;
  }
  console.log("Backup error", error);
  return { status: 500, code: error } as HTTPError;
};
