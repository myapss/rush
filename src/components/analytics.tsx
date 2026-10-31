"use client";

import Link from "next/link";
import Script from "next/script";
import { useSyncExternalStore } from "react";
import { readConsent, subscribeConsent, writeConsent, type Consent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const VALID_GA_ID = GA_ID && /^G-[A-Z0-9]{4,20}$/.test(GA_ID) ? GA_ID : null;

/** Server render and first paint: unknown, so neither banner nor scripts render until hydration. */
const useConsent = () => useSyncExternalStore<Consent | "unknown">(subscribeConsent, readConsent, () => "unknown");

/**
 * Google Analytics 4, loaded only after the visitor accepts. Ads features and
 * Google signals are off. Only mounted on public pages.
 */
export function Analytics() {
  const consent = useConsent();
  if (!VALID_GA_ID || consent === "unknown") return null;
  if (consent === null) return <ConsentBanner />;
  if (consent !== "granted") return null;
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config','${VALID_GA_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${VALID_GA_ID}`} strategy="afterInteractive" />
    </>
  );
}

function ConsentBanner() {
  return (
    <div role="region" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-4 shadow-lg print:hidden">
      <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          We&apos;d like to use Google Analytics cookies to understand how visitors use our public pages. We never use them on
          your dashboard or for ads. See our{" "}
          <Link href="/privacy#cookies" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn" onClick={() => writeConsent("denied")}>
            Decline
          </button>
          <button type="button" className="btn btn-primary" onClick={() => writeConsent("granted")}>
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer link to change the choice later. */
export function CookieSettingsButton() {
  const consent = useConsent();
  if (!VALID_GA_ID || consent === "unknown") return null;
  return (
    <button type="button" className="text-muted hover:text-fg" onClick={() => writeConsent(null)}>
      Cookie settings
    </button>
  );
}
