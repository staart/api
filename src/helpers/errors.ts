export const errorHandler = (error: string) => {
  const errorString = error.toString();
  if (errorString.startsWith("JsonWebTokenError"))
    return { status: 401, code: "invalid-token" };
  return { status: 500, code: "server-error" };
};
