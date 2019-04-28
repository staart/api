import { Application } from "express";
import asyncHandler from "express-async-handler";
import { routeUserMe, routeUserPut, routeUserId } from "./users";
import { routeEmailVerify, routeEmailAdd, routeEmailDelete } from "./emails";
import { routeOrganizationCreate } from "./organizations";
import { authHandler } from "../helpers/middleware";
import {
  routeAuthVerifyToken,
  routeAuthLogin,
  routeAuthResetPasswordRequest,
  routeAuthResetPasswordRecover
} from "./auth";

export const router = (app: Application) => {
  app.get("/", (req, res) => res.json({ hello: "world" }));

  routesAuth(app);
  routesUser(app);
  routesEmail(app);
  routesOrganization(app);

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
  app.get("/users/me", authHandler, asyncHandler(routeUserMe));
  app.get("/users/:id", authHandler, asyncHandler(routeUserId));
  app.put("/users", asyncHandler(routeUserPut));
};

const routesEmail = (app: Application) => {
  app.put("/emails", authHandler, asyncHandler(routeEmailAdd));
  app.delete("/emails/:id", authHandler, asyncHandler(routeEmailDelete));
  app.post("/emails/verify", asyncHandler(routeEmailVerify));
};

const routesOrganization = (app: Application) => {
  app.put("/organizations", authHandler, asyncHandler(routeOrganizationCreate));
};
