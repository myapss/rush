"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main id="main" className="container-page flex flex-1 flex-col items-start justify-center gap-4 py-24">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="max-w-xl text-muted">
        Sorry, that didn&apos;t work. Your data is safe. Please try again, and contact us if it keeps happening
        {error.digest ? ` (reference ${error.digest})` : ""}.
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn">
          Go to the homepage
        </Link>
      </div>
    </main>
  );
}
