import "@babel/polyfill";
import cors from "cors";
import helmet from "helmet";
import { json, urlencoded } from "body-parser";
import { Server } from "@overnightjs/core";
import { UserController } from "./controllers/user";
import { errorHandler, trackingHandler } from "./helpers/middleware";
import { OrganizationController } from "./controllers/organization";
import { AdminController } from "./controllers/admin";
import { AuthController } from "./controllers/auth";
import { MembershipController } from "./controllers/membership";

export class Staart extends Server {
  constructor() {
    super();
    this.app.use(helmet({ hsts: { maxAge: 31536000 } }));
    this.app.use(cors());
    this.app.use(json({ limit: "50mb" }));
    this.app.use(urlencoded({ extended: true }));
    this.app.use(trackingHandler);
    this.setupControllers();
    this.app.use(errorHandler);
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
