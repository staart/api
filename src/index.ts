import express, { Request, Response, NextFunction } from "express";
import { PORT } from "./config";
import { register, verifyEmail } from "./rest/auth";
import asyncHandler from "express-async-handler";
import { HTTPError } from "./interfaces/general";
import { errorHandler, trackingHandler } from "./helpers/middleware";

const app = express();

app.use(trackingHandler);

app.get("/", (req, res) => res.json({ hello: "world" }));

app.put("/user", async (req, res) => {
  const user = req.body;
  const email = user.email;
  delete user.email;
  const users = await register(user, email);
  res.json({ success: true, users });
});

app.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    await verifyEmail(req.params.token, res.locals);
    res.json({ success: true });
  })
);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const response: HTTPError = errorHandler(error.toString());
  res.status(response.status);
  res.json({ error: response.code, message: response.message });
});

app.listen(PORT, () => console.log("App running"));
