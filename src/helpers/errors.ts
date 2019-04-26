import { ErrorCode } from "../interfaces/enum";
import { HTTPError } from "../interfaces/general";

export const safeError = (error: string) => {
  const errorString = error.toString();
  if (errorString.startsWith("JsonWebTokenError"))
    return sendError(ErrorCode.INVALID_TOKEN);
  return sendError(error);
};

export const sendError = (error: string) => {
  if (error.includes("/")) {
    const status = parseInt(error.split("/")[0]);
    const code = error.split("/")[1];
    return { status, code } as HTTPError;
  }
  return { status: 500, code: error } as HTTPError;
};
