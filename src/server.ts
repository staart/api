import "@babel/polyfill";
import cors from "cors";
import helmet from "helmet";
import { json, urlencoded } from "body-parser";
import { Server } from "@overnightjs/core";
import { UserController } from "./routes/users";
import { errorHandler, trackingHandler } from "./helpers/middleware";

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
    const userController = new UserController();
    super.addControllers([userController]);
  }

  public start(port: number): void {
    this.app.listen(port, () => console.log(`Listening on ${port}!`));
  }
}
