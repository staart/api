import { checkIfDisposableEmail } from "@staart/disposable-email";
import {
  INSUFFICIENT_PERMISSION,
  INVALID_2FA_TOKEN,
  INVALID_LOGIN,
  MISSING_PASSWORD,
  NOT_ENABLED_2FA,
  OAUTH_NO_EMAIL,
  OAUTH_NO_NAME,
  RESOURCE_NOT_FOUND,
  USERNAME_EXISTS,
  USER_NOT_FOUND
} from "@staart/errors";
import { compare } from "@staart/text";
import axios from "axios";
import ClientOAuth2 from "client-oauth2";
import { authenticator } from "otplib";
import {
  ALLOW_DISPOSABLE_EMAILS,
  BASE_URL,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET
} from "../config";
import {
  checkIfNewEmail,
  createEmail,
  getEmail,
  getUserEmails,
  updateEmail
} from "../crud/email";
import { createMembership } from "../crud/membership";
import { getDomainByDomainName } from "../crud/organization";
import {
  addApprovedLocation,
  checkUsernameAvailability,
  createUser,
  deleteSessionByJwt,
  getBestUsernameForUser,
  getUser,
  getUserBackupCode,
  getUserByEmail,
  updateBackupCode,
  updateUser
} from "../crud/user";
import { can } from "../helpers/authorization";
import {
  checkInvalidatedToken,
  getLoginResponse,
  passwordResetToken,
  postLoginTokens,
  TokenResponse,
  verifyToken
} from "../helpers/jwt";
import { mail } from "../helpers/mail";
import { trackEvent } from "../helpers/tracking";
import {
  Authorizations,
  EventType,
  MembershipRole,
  Templates,
  Tokens
} from "../interfaces/enum";
import { KeyValue, Locals } from "../interfaces/general";
import { InsertResult } from "../interfaces/mysql";
import { GitHubEmail } from "../interfaces/oauth";
import { User } from "../interfaces/tables/user";

export const validateRefreshToken = async (token: string, locals: Locals) => {
  await checkInvalidatedToken(token);
  const data = await verifyToken<{ id: string }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  const user = await getUser(data.id);
  return postLoginTokens(user, locals, token);
};

export const invalidateRefreshToken = async (token: string, locals: Locals) => {
  const data = await verifyToken<{ id: string }>(token, Tokens.REFRESH);
  if (!data.id) throw new Error(USER_NOT_FOUND);
  await deleteSessionByJwt(data.id, token);
};

export const login = async (
  email: string,
  password: string,
  locals: Locals
) => {
  const user = await getUserByEmail(email, true);
  if (!user.password) throw new Error(MISSING_PASSWORD);
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const correctPassword = await compare(password, user.password);
  if (correctPassword)
    return getLoginResponse(user, EventType.AUTH_LOGIN, "local", locals);
  throw new Error(INVALID_LOGIN);
};

export const login2FA = async (code: number, token: string, locals: Locals) => {
  const data = await verifyToken<{ id: string }>(token, Tokens.TWO_FACTOR);
  const user = await getUser(data.id, true);
  const secret = user.twoFactorSecret;
  if (!secret) throw new Error(NOT_ENABLED_2FA);
  if (!user.id) throw new Error(USER_NOT_FOUND);
  if (authenticator.check(code.toString(), secret))
    return postLoginTokens(user, locals);
  const backupCode = await getUserBackupCode(data.id, code);
  if (backupCode && !backupCode.used) {
    await updateBackupCode(backupCode.code, { used: true });
    return postLoginTokens(user, locals);
  }
  throw new Error(INVALID_2FA_TOKEN);
};

export const register = async (
  user: User,
  locals?: Locals,
  email?: string,
  organizationId?: string,
  role?: MembershipRole,
  emailVerified?: boolean
) => {
  if (email) {
    await checkIfNewEmail(email);
    if (!ALLOW_DISPOSABLE_EMAILS) checkIfDisposableEmail(email);
  }
  if (user.username && !(await checkUsernameAvailability(user.username)))
    throw new Error(USERNAME_EXISTS);
  user.username = user.username || (await getBestUsernameForUser(user.name));
  const result = (await createUser(user)) as InsertResult;
  const userId = result.insertId as number;
  // Set email
  if (email) {
    const newEmail = (await createEmail(
      {
        userId,
        email,
        isVerified: !!emailVerified
      },
      !emailVerified,
      !user.password
    )) as InsertResult;
    const emailId = newEmail.insertId;
    await updateUser(userId, { primaryEmail: emailId });
  }
  if (organizationId) {
    await createMembership({
      userId,
      organizationId,
      role: role || MembershipRole.MEMBER
    });
  } else if (email) {
    let domain = "";
    try {
      domain = email.split("@")[1];
    } catch (error) {}
    if (domain) {
      const domainDetails = await getDomainByDomainName(domain);
      if (domainDetails) {
        await createMembership({
          userId,
          organizationId: domainDetails.organizationId,
          role: MembershipRole.MEMBER
        });
      }
    }
  }
  if (locals) await addApprovedLocation(userId, locals.ipAddress);
  return { userId };
};

export const sendPasswordReset = async (email: string, locals?: Locals) => {
  const user = await getUserByEmail(email);
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const token = await passwordResetToken(user.id);
  await mail(email, Templates.PASSWORD_RESET, { name: user.name, token });
  if (locals)
    trackEvent(
      {
        userId: user.id,
        type: EventType.AUTH_PASSWORD_RESET_REQUESTED,
        data: { token }
      },
      locals
    );
  return;
};

export const sendNewPassword = async (userId: string, email: string) => {
  const user = await getUser(userId);
  const userEmails = await getUserEmails(userId);
  if (!userEmails.filter(userEmail => userEmail.email === email).length)
    throw new Error(RESOURCE_NOT_FOUND);
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const token = await passwordResetToken(user.id);
  await mail(email, Templates.NEW_PASSWORD, { name: user.name, token });
  return;
};

export const verifyEmail = async (token: string, locals: Locals) => {
  const emailId = (
    await verifyToken<{ id: string }>(token, Tokens.EMAIL_VERIFY)
  ).id;
  const email = await getEmail(emailId);
  trackEvent(
    {
      userId: email.userId,
      type: EventType.EMAIL_VERIFIED,
      data: { id: emailId }
    },
    locals
  );
  return updateEmail(emailId, { isVerified: true });
};

export const updatePassword = async (
  token: string,
  password: string,
  locals: Locals
) => {
  const userId = (
    await verifyToken<{ id: string }>(token, Tokens.PASSWORD_RESET)
  ).id;
  await updateUser(userId, { password });
  trackEvent(
    {
      userId,
      type: EventType.AUTH_PASSWORD_CHANGED
    },
    locals
  );
  return;
};

export const impersonate = async (
  tokenUserId: string,
  impersonateUserId: string,
  locals: Locals
) => {
  if (
    await can(
      tokenUserId,
      Authorizations.IMPERSONATE,
      "user",
      impersonateUserId
    )
  )
    return getLoginResponse(
      await getUser(impersonateUserId),
      EventType.AUTH_LOGIN,
      "impersonate",
      locals
    );
  throw new Error(INSUFFICIENT_PERMISSION);
};

export const approveLocation = async (token: string, locals: Locals) => {
  const tokenUser = await verifyToken<TokenResponse>(
    token,
    Tokens.APPROVE_LOCATION
  );
  if (!tokenUser.id) throw new Error(USER_NOT_FOUND);
  const user = await getUser(tokenUser.id);
  if (!user.id) throw new Error(USER_NOT_FOUND);
  const ipAddress = tokenUser.ipAddress || locals.ipAddress;
  await addApprovedLocation(user.id, ipAddress);
  trackEvent(
    {
      userId: tokenUser.id,
      type: EventType.AUTH_APPROVE_LOCATION
    },
    locals
  );
  return getLoginResponse(
    user,
    EventType.AUTH_APPROVE_LOCATION,
    ipAddress,
    locals
  );
};

/*
 OAuth clients
*/

const redirectUri = (service: string) =>
  `${BASE_URL}/auth/oauth/callback/${service}`;

const loginOrRegisterWithEmail = async (
  service: string,
  email: string,
  name: string,
  locals: Locals
) => {
  let user: User | undefined;
  try {
    user = await getUserByEmail(email);
  } catch (error) {}
  if (user) {
    return getLoginResponse(user, EventType.AUTH_LOGIN_OAUTH, "github", locals);
  } else {
    const user = await register(
      {
        name
      },
      locals,
      email,
      undefined,
      undefined,
      true
    );
    return getLoginResponse(
      await getUser(user.userId),
      EventType.AUTH_LOGIN_OAUTH,
      service,
      locals
    );
  }
};

export const github = new ClientOAuth2({
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  redirectUri: redirectUri("github"),
  authorizationUri: "https://github.com/login/oauth/authorize",
  accessTokenUri: "https://github.com/login/oauth/access_token",
  scopes: ["user:email", "user:name"]
});
export const githubCallback = async (url: string, locals: Locals) => {
  const response = await github.code.getToken(url);
  let email: string | undefined;
  let name: string | undefined;
  const emails = ((
    await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${response.accessToken}`
      }
    })
  ).data as Array<GitHubEmail>).filter(emails => (emails.verified = true));
  for await (const email of emails) {
    try {
      const user = await getUserByEmail(email.email);
      return await getLoginResponse(
        user,
        EventType.AUTH_LOGIN_OAUTH,
        "github",
        locals
      );
    } catch (error) {}
  }
  const me = (
    await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${response.accessToken}`
      }
    })
  ).data;
  try {
    email = emails[0].email;
    name = me.name;
  } catch (error) {}
  if (email && name) {
    return loginOrRegisterWithEmail("facebook", email, name, locals);
  }
  if (!name) throw new Error(OAUTH_NO_NAME);
  throw new Error(OAUTH_NO_EMAIL);
};

export const facebook = new ClientOAuth2({
  clientId: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  redirectUri: redirectUri("facebook"),
  authorizationUri: "https://www.facebook.com/v3.3/dialog/oauth",
  accessTokenUri: "https://graph.facebook.com/v3.3/oauth/access_token",
  scopes: ["email"]
});
export const facebookCallback = async (url: string, locals: Locals) => {
  const response = await facebook.code.getToken(url);
  let email: string | undefined;
  let name: string | undefined;
  try {
    const data = (
      await axios.get(
        `https://graph.facebook.com/me?fields=email name&access_token=${response.data.access_token}`
      )
    ).data;
    email = data.email;
    name = data.name;
  } catch (error) {}
  if (email && name) {
    return loginOrRegisterWithEmail("facebook", email, name, locals);
  }
  if (!name) throw new Error(OAUTH_NO_NAME);
  throw new Error(OAUTH_NO_EMAIL);
};

export const salesforce = new ClientOAuth2({
  clientId: SALESFORCE_CLIENT_ID,
  clientSecret: SALESFORCE_CLIENT_SECRET,
  redirectUri: redirectUri("salesforce"),
  authorizationUri: "https://login.salesforce.com/services/oauth2/authorize",
  accessTokenUri: "https://login.salesforce.com/services/oauth2/token",
  scopes: ["email"]
});
export const salesforceCallback = async (url: string, locals: Locals) => {
  const response = await salesforce.code.getToken(url);
  let email: string | undefined;
  let name: string | undefined;
  try {
    const data = (
      await axios.get("https://login.salesforce.com/services/oauth2/userinfo", {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      })
    ).data;
    if (!data.email_verified) throw new Error(OAUTH_NO_EMAIL);
    email = data.email;
    name = data.name;
  } catch (error) {}
  if (email && name) {
    return loginOrRegisterWithEmail("salesforce", email, name, locals);
  }
  if (!name) throw new Error(OAUTH_NO_NAME);
  throw new Error(OAUTH_NO_EMAIL);
};
