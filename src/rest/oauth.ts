import ClientOAuth2 from "client-oauth2";
import axios from "axios";
import {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  BASE_URL
} from "../config";
import { Locals } from "../interfaces/general";
import { ErrorCode, EventType } from "../interfaces/enum";
import { getUserByEmail, getUser } from "../crud/user";
import { getLoginResponse } from "../helpers/jwt";
import { User } from "../interfaces/tables/user";
import { register } from "./auth";

const getRedirectUri = (service: string) =>
  `${BASE_URL}/auth/oauth/${service}/callback`;

export const loginWithOAuth2Service = async (
  service: string,
  name?: string,
  email?: string,
  locals?: Locals
) => {
  if (!name) throw new Error(ErrorCode.OAUTH_NO_NAME);
  if (!email) throw new Error(ErrorCode.OAUTH_NO_EMAIL);
  let user: User | undefined;
  try {
    user = await getUserByEmail(email);
  } catch (error) {}
  if (user)
    return await getLoginResponse(
      user,
      EventType.AUTH_LOGIN_OAUTH,
      service,
      locals
    );
  const newUser = await register(
    { name },
    locals,
    email,
    undefined,
    undefined,
    true
  );
  return await getLoginResponse(
    await getUser(newUser.userId),
    EventType.AUTH_LOGIN_OAUTH,
    service,
    locals
  );
};

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
    const data = (await axios.get(
      "https://login.salesforce.com/services/oauth2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )).data;
    if (!data.email_verified) throw new Error(ErrorCode.OAUTH_NO_EMAIL);
    return loginWithOAuth2Service("salesforce", data.name, data.email, locals);
  }
};
