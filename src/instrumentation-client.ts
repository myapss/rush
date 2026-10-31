import * as Sentry from "@sentry/nextjs";
import { DATA_COLLECTION, scrubEvent } from "@/lib/monitoring/scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    dataCollection: { ...DATA_COLLECTION, httpBodies: [...DATA_COLLECTION.httpBodies] },
    tracesSampleRate: 0.05,
    // No session replay: pages can show health information.
    integrations: [],
    beforeSend: scrubEvent,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
