import "@babel/polyfill";
import { Server, Get, Controller } from "@staart/server";
import { success } from "@staart/errors";
import { setupMiddleware } from "@staart/server";

import {
  errorHandler,
  trackingHandler,
  rateLimitHandler,
  speedLimitHandler
} from "./helpers/middleware";

@Controller("/v1")
class RootController {
  @Get()
  async info() {
    return {
      repository: "https://github.com/staart/api",
      docs: "https://staart.js.org",
      madeBy: ["https://o15y.com", "https://anandchowdhary.com"]
    };
  }
}

export class Staart extends Server {
  constructor() {
    super();
    this.setupHandlers();
    this.addControllers([new RootController()]);
    this.app.use(errorHandler);
  }

  private setupHandlers() {
    setupMiddleware(this.app);
    this.app.use(trackingHandler);
    this.app.use(rateLimitHandler);
    this.app.use(speedLimitHandler);
  }

  public start(port: number): void {
    this.app.listen(port, () => success(`Listening on ${port}`));
  }
}
