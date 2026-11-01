"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Last-resort boundary for errors in the root layout. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", maxWidth: 640, margin: "0 auto" }}>
        <h1>Something went wrong</h1>
        <p>Sorry, ChopPlanner hit an unexpected error. Please try again.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
        <button type="button" onClick={reset} style={{ padding: "0.6rem 1rem", fontSize: "1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
