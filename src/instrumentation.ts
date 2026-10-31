import * as Sentry from "@sentry/nextjs";
import { DATA_COLLECTION, scrubEvent } from "@/lib/monitoring/scrub";

export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    dataCollection: { ...DATA_COLLECTION, httpBodies: [...DATA_COLLECTION.httpBodies] },
    tracesSampleRate: 0.05,
    beforeSend: scrubEvent,
  });
}

/** Reports server errors (rendering, route handlers, server actions) to Sentry. */
export const onRequestError = Sentry.captureRequestError;
