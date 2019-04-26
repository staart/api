import { Application } from "express";
import asyncHandler from "express-async-handler";
import { routeUserMe, routeUserPut } from "./users";
import { routeEmailVerify } from "./emails";

export const router = (app: Application) => {
  app.get("/", (req, res) => res.json({ hello: "world" }));

  routesUser(app);
  routesEmail(app);

  return app;
};

const routesUser = (app: Application) => {
  app.get("/users/me", asyncHandler(routeUserMe));
  app.put("/users", asyncHandler(routeUserPut));
};

const routesEmail = (app: Application) => {
  app.post("/emails/verify", asyncHandler(routeEmailVerify));
};
