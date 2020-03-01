import "@babel/polyfill";
import { Server } from "@staart/server";
import { success } from "@staart/errors";
import { setupMiddleware } from "@staart/server";

// This `join` is required for static files in app.ts
import { join } from "path";

import {
  errorHandler,
  trackingHandler,
  rateLimitHandler,
  speedLimitHandler
} from "./helpers/middleware";
import { Request, Response } from "express";

export class Staart extends Server {
  constructor() {
    super();
    this.setupHandlers();
    this.setupControllers();
    this.app.use(errorHandler);
  }

  private setupHandlers() {
    setupMiddleware(this.app);
    this.app.use(trackingHandler);
    this.app.use(rateLimitHandler);
    this.app.use(speedLimitHandler);
  }

  private setupControllers() {
    this.app.get("/", (req: Request, res: Response) =>
      res.json({
        repository: "https://github.com/staart/api",
        docs: "https://staart.js.org"
      })
    );
    // staart:setup/controllers
  }

  public start(port: number): void {
    this.app.listen(port, () => success(`Listening on ${port}`));
  }
}
