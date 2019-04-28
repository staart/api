import { Application } from "express";
import asyncHandler from "express-async-handler";
import { routeUserId, routeUserUpdate } from "./users";
import {
  routeEmailVerify,
  routeEmailAdd,
  routeEmailDelete,
  routeEmailVerifyResend
} from "./emails";
import {
  routeOrganizationCreate,
  routeOrganizationUpdate,
  routeOrganizationDelete,
  routeOrganizationGet
} from "./organizations";
import { authHandler } from "../helpers/middleware";
import {
  routeAuthVerifyToken,
  routeAuthLogin,
  routeAuthResetPasswordRequest,
  routeAuthResetPasswordRecover,
  routeAuthRegister
} from "./auth";
import { routeMembershipGet, routeMembershipCreate } from "./membership";

export const router = (app: Application) => {
  app.get("/", (req, res) => res.json({ hello: "world" }));

  routesAuth(app);
  routesUser(app);
  routesEmail(app);
  routesOrganization(app);
  routesMembership(app);

  return app;
};

const routesAuth = (app: Application) => {
  app.post("/auth/login", asyncHandler(routeAuthLogin));
  app.post("/auth/verify-token", asyncHandler(routeAuthVerifyToken));
  app.post(
    "/auth/reset-password/request",
    asyncHandler(routeAuthResetPasswordRequest)
  );
  app.post(
    "/auth/reset-password/recover",
    asyncHandler(routeAuthResetPasswordRecover)
  );
};

const routesUser = (app: Application) => {
  app.put("/users", asyncHandler(routeAuthRegister));
  app.get("/users/:id", authHandler, asyncHandler(routeUserId));
  app.patch("/users/:id", authHandler, asyncHandler(routeUserUpdate));
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
};

const routesMembership = (app: Application) => {
  app.get(
    "/organizations/:organizationId/memberships/:id",
    authHandler,
    asyncHandler(routeMembershipGet)
  );
  app.put(
    "/organizations/:organizationId/memberships",
    authHandler,
    asyncHandler(routeMembershipCreate)
  );
};
