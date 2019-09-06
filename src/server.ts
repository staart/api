import "@babel/polyfill";
import helmet from "helmet";
import cors from "cors";
import responseTime from "response-time";
import { json, urlencoded } from "body-parser";
import { Server } from "@overnightjs/core";
import {
  errorHandler,
  trackingHandler,
  rateLimitHandler,
  speedLimitHandler
} from "./helpers/middleware";
import { Request, Response } from "express";
import { DISALLOW_OPEN_CORS } from "./config";

export class Staart extends Server {
  constructor() {
    super();
    this.setupHandlers();
    this.setupControllers();
    if (!DISALLOW_OPEN_CORS) this.app.use(errorHandler);
  }

  private setupHandlers() {
    this.app.use(cors());
    this.app.use(helmet({ hsts: { maxAge: 31536000, preload: true } }));
    this.app.use(json({ limit: "50mb" }));
    this.app.use(urlencoded({ extended: true }));
    this.app.use(responseTime());
    this.app.use(trackingHandler);
    this.app.use(rateLimitHandler);
    this.app.use(speedLimitHandler);
  }

  private setupControllers() {
    this.app.get("/", (req: Request, res: Response) =>
      res.json({
        repository: "https://github.com/o15y/staart",
        demo: "https://staart-demo.o15y.com"
      })
    );
    // staart:setup/controllers
  }

  public start(port: number): void {
    this.app.listen(port, () => console.log(`✅  Listening on ${port}`));
  }
}
