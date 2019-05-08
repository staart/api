import { google } from "googleapis";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_REDIRECT
} from "../config";
import { ErrorCode } from "../interfaces/enum";
import { GetTokenResponse } from "google-auth-library/build/src/auth/oauth2client";

/**
 * Create a new OAuth connection with Google
 */
export const googleCreateConnection = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_REDIRECT
  );
};

/**
 * Get the URL for "Login with Google"
 */
export const googleGetConnectionUrl = () => {
  const auth = googleCreateConnection();
  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/userinfo.email"],
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CLIENT_REDIRECT
  });
};

/**
 * Get Google OAuth tokens from a returned code
 */
export const googleGetTokensFromCode = async (code: string) => {
  const auth = googleCreateConnection();
  try {
    return await auth.getToken(code);
  } catch (error) {
    console.log("Got error", error);
    throw new Error(ErrorCode.GOOGLE_AUTH_ERROR);
  }
};

/**
 * Get a user's email from their Google OAuth token
 */
export const googleGetEmailFromToken = async (data: GetTokenResponse) => {
  const auth = googleCreateConnection();
  auth.setCredentials(data.tokens);
  const plus = google.plus({ version: "v1", auth });
  const user = await plus.people.get({ userId: "me" });
  const email =
    user.data.emails && user.data.emails.length
      ? user.data.emails[0].value
      : "";
  if (!email) throw new Error(ErrorCode.GOOGLE_AUTH_ERROR);
  return email;
};
