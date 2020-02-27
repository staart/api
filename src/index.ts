import { Staart } from "./app";
import { PORT, SENTRY_DSN } from "./config";
import { init } from "@sentry/node";
import "./init-tests";

if (SENTRY_DSN) init({ dsn: SENTRY_DSN });

const staart = new Staart();
staart.start(PORT);
