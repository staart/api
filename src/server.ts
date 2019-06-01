import "@babel/polyfill";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rfs from "rotating-file-stream";
import responseTime from "response-time";
import { json, urlencoded } from "body-parser";
import { Server } from "@overnightjs/core";
import { UserController } from "./controllers/user";
import {
  errorHandler,
  trackingHandler,
  rateLimitHandler,
  speedLimitHandler
} from "./helpers/middleware";
import { OrganizationController } from "./controllers/organization";
import { AdminController } from "./controllers/admin";
import { AuthController } from "./controllers/auth";
import { MembershipController } from "./controllers/membership";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const logDirectory = join(__dirname, "..", "logs");
existsSync(logDirectory) || mkdirSync(logDirectory);
const accessLogStream = rfs("access.log", {
  interval: "1d",
  path: logDirectory
});

export class Staart extends Server {
  constructor() {
    super();
    this.setupHandlers();
    this.setupControllers();
    this.app.use(errorHandler);
  }

  private setupHandlers() {
    this.app.use(helmet({ hsts: { maxAge: 31536000, preload: true } }));
    this.app.use(morgan("combined", { stream: accessLogStream }));
    this.app.use(cors());
    this.app.use(json({ limit: "50mb" }));
    this.app.use(urlencoded({ extended: true }));
    this.app.use(responseTime());
    this.app.use(trackingHandler);
    this.app.use(rateLimitHandler);
    this.app.use(speedLimitHandler);
  }

  private setupControllers() {
    const authController = new AuthController();
    const userController = new UserController();
    const organizationController = new OrganizationController();
    const membershipController = new MembershipController();
    const adminController = new AdminController();

    super.addControllers([
      authController,
      userController,
      organizationController,
      membershipController,
      adminController
    ]);
  }

  public start(port: number): void {
    this.app.listen(port, () => console.log(`Listening on ${port}!`));
  }
}
