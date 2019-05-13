import { Application } from "express";
import asyncHandler from "express-async-handler";
import {
  routeUserId,
  routeUserUpdate,
  routeUserAllData,
  routeUserRecentEvents,
  routeUserDelete,
  routeUserMemberships,
  routeUserApiKeysGet,
  routeUserApiKeysPut,
  routeUserApiKeyGet,
  routeUserApiKeyUpdate,
  routeUserApiKeyDelete
} from "./users";
import {
  routeEmailVerify,
  routeEmailAdd,
  routeEmailDelete,
  routeEmailVerifyResend,
  routeEmailList
} from "./emails";
import {
  routeOrganizationCreate,
  routeOrganizationUpdate,
  routeOrganizationDelete,
  routeOrganizationGet,
  routeOrganizationBillingGet,
  routeOrganizationBillingUpdate,
  routeOrganizationInvoicesGet,
  routeOrganizationSubscriptionsGet,
  routeOrganizationPricingPlansGet,
  routeOrganizationSourcesGet,
  routeOrganizationSourceGet,
  routeOrganizationSourcesPut,
  routeOrganizationSourceUpdate,
  routeOrganizationSourceDelete,
  routeOrganizationDataGet,
  routeOrganizationRecentEventsGet
} from "./organizations";
import { authHandler } from "../helpers/middleware";
import {
  routeAuthVerifyToken,
  routeAuthLogin,
  routeAuthResetPasswordRequest,
  routeAuthResetPasswordRecover,
  routeAuthRegister,
  routeAuthRefresh,
  routeAuthLoginWithGoogleLink,
  routeAuthLoginWithGoogleVerify,
  routeAuthImpersonate,
  routeAuthApproveLocation
} from "./auth";
import {
  routeMembershipGet,
  routeMembershipCreate,
  routeMembershipList,
  routeMembershipDelete,
  routeMembershipUpdate
} from "./membership";
import { routeAdminUsers, routeAdminOrganizations } from "./admin";

export const router = (app: Application) => {
  app.get("/", (req, res) => res.json({ hello: "world" }));

  routesAuth(app);
  routesUser(app);
  routesEmail(app);
  routesOrganization(app);
  routesMembership(app);
  routesAdmin(app);

  return app;
};

const routesAuth = (app: Application) => {
  app.post("/auth/login", asyncHandler(routeAuthLogin));
  app.post("/auth/refresh", asyncHandler(routeAuthRefresh));
  app.post("/auth/verify-token", asyncHandler(routeAuthVerifyToken));
  app.post("/auth/approve-location", asyncHandler(routeAuthApproveLocation));
  app.post(
    "/auth/reset-password/request",
    asyncHandler(routeAuthResetPasswordRequest)
  );
  app.post(
    "/auth/reset-password/recover",
    asyncHandler(routeAuthResetPasswordRecover)
  );
  app.get("/auth/google/link", asyncHandler(routeAuthLoginWithGoogleLink));
  app.post("/auth/google/verify", asyncHandler(routeAuthLoginWithGoogleVerify));
  app.get(
    "/auth/impersonate/:id",
    authHandler,
    asyncHandler(routeAuthImpersonate)
  );
};

const routesUser = (app: Application) => {
  app.put("/users", asyncHandler(routeAuthRegister));
  app.get("/users/:id", authHandler, asyncHandler(routeUserId));
  app.delete("/users/:id", authHandler, asyncHandler(routeUserDelete));
  app.patch("/users/:id", authHandler, asyncHandler(routeUserUpdate));
  app.get(
    "/users/:id/events",
    authHandler,
    asyncHandler(routeUserRecentEvents)
  );
  app.get("/users/:id/data", authHandler, asyncHandler(routeUserAllData));
  app.get("/users/:id/emails", authHandler, asyncHandler(routeEmailList));
  app.get(
    "/users/:id/memberships",
    authHandler,
    asyncHandler(routeUserMemberships)
  );
  app.get(
    "/users/:id/api-keys",
    authHandler,
    asyncHandler(routeUserApiKeysGet)
  );
  app.put(
    "/users/:id/api-keys",
    authHandler,
    asyncHandler(routeUserApiKeysPut)
  );
  app.get(
    "/users/:id/api-key/:apiKey",
    authHandler,
    asyncHandler(routeUserApiKeyGet)
  );
  app.patch(
    "/users/:id/api-key/:apiKey",
    authHandler,
    asyncHandler(routeUserApiKeyUpdate)
  );
  app.delete(
    "/users/:id/api-key/:apiKey",
    authHandler,
    asyncHandler(routeUserApiKeyDelete)
  );
};

const routesEmail = (app: Application) => {
  app.put("/emails", authHandler, asyncHandler(routeEmailAdd));
  app.delete("/emails/:id", authHandler, asyncHandler(routeEmailDelete));
  app.post("/emails/:id/resend", asyncHandler(routeEmailVerifyResend));
  app.post("/emails/verify", asyncHandler(routeEmailVerify));
};

const routesOrganization = (app: Application) => {
  app.put("/organizations", authHandler, asyncHandler(routeOrganizationCreate));
  app.patch(
    "/organizations/:id",
    authHandler,
    asyncHandler(routeOrganizationUpdate)
  );
  app.get(
    "/organizations/:id",
    authHandler,
    asyncHandler(routeOrganizationGet)
  );
  app.delete(
    "/organizations/:id",
    authHandler,
    asyncHandler(routeOrganizationDelete)
  );
  app.get(
    "/organizations/:organizationId/memberships",
    authHandler,
    asyncHandler(routeMembershipList)
  );
  app.put(
    "/organizations/:organizationId/memberships",
    authHandler,
    asyncHandler(routeMembershipCreate)
  );
  app.get(
    "/organizations/:id/billing",
    authHandler,
    asyncHandler(routeOrganizationBillingGet)
  );
  app.patch(
    "/organizations/:id/billing",
    authHandler,
    asyncHandler(routeOrganizationBillingUpdate)
  );
  app.put(
    "/organizations/:id/billing",
    authHandler,
    asyncHandler(routeOrganizationBillingUpdate)
  );
  app.get(
    "/organizations/:id/invoices",
    authHandler,
    asyncHandler(routeOrganizationInvoicesGet)
  );
  app.get(
    "/organizations/:id/subscriptions",
    authHandler,
    asyncHandler(routeOrganizationSubscriptionsGet)
  );
  app.get(
    "/organizations/:id/pricing/:product",
    authHandler,
    asyncHandler(routeOrganizationPricingPlansGet)
  );
  app.get(
    "/organizations/:id/sources",
    authHandler,
    asyncHandler(routeOrganizationSourcesGet)
  );
  app.put(
    "/organizations/:id/sources",
    authHandler,
    asyncHandler(routeOrganizationSourcesPut)
  );
  app.get(
    "/organizations/:id/sources/:sourceId",
    authHandler,
    asyncHandler(routeOrganizationSourceGet)
  );
  app.patch(
    "/organizations/:id/sources/:sourceId",
    authHandler,
    asyncHandler(routeOrganizationSourceUpdate)
  );
  app.delete(
    "/organizations/:id/sources/:sourceId",
    authHandler,
    asyncHandler(routeOrganizationSourceDelete)
  );
  app.get(
    "/organizations/:id/data",
    authHandler,
    asyncHandler(routeOrganizationDataGet)
  );
  app.get(
    "/organizations/:id/events",
    authHandler,
    asyncHandler(routeOrganizationRecentEventsGet)
  );
};

const routesMembership = (app: Application) => {
  app.get("/memberships/:id", authHandler, asyncHandler(routeMembershipGet));
  app.patch(
    "/memberships/:id",
    authHandler,
    asyncHandler(routeMembershipUpdate)
  );
  app.delete(
    "/memberships/:id",
    authHandler,
    asyncHandler(routeMembershipDelete)
  );
};

const routesAdmin = (app: Application) => {
  app.get("/users", authHandler, asyncHandler(routeAdminUsers));
  app.get("/organizations", authHandler, asyncHandler(routeAdminOrganizations));
};
