import "@babel/polyfill";
import { Server } from "@staart/server";
import { success } from "@staart/errors";

// `asyncHandler` and `join` are required

import { setupMiddleware, Request, Response, asyncHandler } from "@staart/server";
import { join } from "path";

import {
  errorHandler,
  trackingHandler,
  rateLimitHandler,
  speedLimitHandler
} from "./helpers/middleware";

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
