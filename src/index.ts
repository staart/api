import express from "express";
import { PORT } from "./config";
import { errorHandler, trackingHandler } from "./helpers/middleware";
import { router } from "./routes";

const app = express();

app.use(trackingHandler);
router(app);

app.use(errorHandler);

app.listen(PORT, () => console.log("App running"));
