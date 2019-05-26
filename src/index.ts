import { Staart } from "./server";
import { PORT } from "./config";

const staart = new Staart();
staart.start(PORT);
