import ClientOAuth2 from "client-oauth2";
import {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  BASE_URL
} from "../config";
import { Locals } from "../interfaces/general";
import { ErrorCode } from "../interfaces/enum";

const getRedirectUri = (service: string) =>
  `${BASE_URL}/auth/oauth/${service}/callback`;

export const loginWithOAuth2Service = async (
  service: string,
  name: string,
  email: string
) => {};

export const salesforce = {
  client: new ClientOAuth2({
    clientId: SALESFORCE_CLIENT_ID,
    clientSecret: SALESFORCE_CLIENT_SECRET,
    redirectUri: getRedirectUri("salesforce"),
    authorizationUri: "https://login.salesforce.com/services/oauth2/authorize",
    accessTokenUri: "https://login.salesforce.com/services/oauth2/token",
    scopes: ["id"]
  }),
  callback: async (url: string, locals: Locals) => {
    const token = (await salesforce.client.code.getToken(url)).accessToken;
    console.log("Token is", token);
    throw new Error(ErrorCode.OAUTH_NO_EMAIL);
  }
};
