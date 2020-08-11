import { cosmicSync, config } from "@anandchowdhary/cosmic";
cosmicSync("staart");

import { success } from "@staart/errors";
import { Controller, Get, Server } from "@staart/server";
import { setupMiddleware } from "@staart/server";

import {
  errorHandler,
  rateLimitHandler,
  speedLimitHandler,
  trackingHandler,
} from "./_staart/helpers/middleware";

@Controller(config("controllerPrefix"))
class RootController {
  @Get()
  async info() {
    return {
      repository: "https://github.com/staart/api",
      docs: "https://staart.js.org",
      madeBy: ["https://anandchowdhary.com"],
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

  public start(port: number): void {
    this.app.listen(port, () => success(`Listening on ${port}`));
  }

  private setupHandlers() {
    setupMiddleware(this.app);
    this.app.use(trackingHandler);
    this.app.use(rateLimitHandler);
    this.app.use(speedLimitHandler);
  }
}
