import { Staart } from "./server";
import { PORT, SENTRY_DSN } from "./config";
import { init } from "@sentry/node";

if (SENTRY_DSN) init({ dsn: SENTRY_DSN });

const staart = new Staart();
staart.start(PORT);
