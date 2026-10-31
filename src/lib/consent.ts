/** Analytics consent, stored in a first-party cookie (no tracking before a choice). */
export type Consent = "granted" | "denied" | null;

const COOKIE = "np_analytics_consent";
const EVENT = "np-consent-change";

export function readConsent(): Consent {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`));
  return (m?.[1] as Consent) ?? null;
}

export function writeConsent(value: Consent) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = value
    ? `${COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`
    : `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  if (value !== "granted") {
    // Remove Google Analytics cookies when consent is withdrawn.
    for (const c of document.cookie.split("; ")) {
      const name = c.split("=")[0];
      if (name === "_ga" || name.startsWith("_ga_")) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${location.hostname.replace(/^www\./, "")}`;
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      }
    }
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeConsent(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

type Gtag = (...args: unknown[]) => void;

/** Send an analytics event if (and only if) the user has consented. Never include personal or health data. */
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  if (readConsent() !== "granted") return;
  (window as unknown as { gtag?: Gtag }).gtag?.("event", name, params);
}
