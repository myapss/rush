import type { ErrorEvent } from "@sentry/nextjs";

/** Query parameters that can carry secrets (sign-in links, OAuth codes). */
const SECRET_PARAMS = /([?&](?:token_hash|token|code|access_token|refresh_token|email|next)=)[^&#]*/gi;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function scrubUrl(url: string): string {
  return url.replace(SECRET_PARAMS, "$1[redacted]");
}

export function scrubText(text: string): string {
  return scrubUrl(text).replace(EMAIL, "[email]");
}

/**
 * Remove personal and health data before an error leaves the server or
 * browser: no cookies, headers, request bodies, user details or emails.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    if (typeof event.request.query_string === "string") event.request.query_string = "[redacted]";
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (event.message) event.message = scrubText(event.message);
  for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = scrubText(ex.value);
  event.breadcrumbs = event.breadcrumbs?.map((b) => ({
    ...b,
    message: b.message ? scrubText(b.message) : b.message,
    data: b.data?.url ? { ...b.data, url: scrubUrl(String(b.data.url)) } : undefined,
  }));
  return event;
}

/**
 * Sentry data collection: nothing personal. Meal plans, prompts, request
 * bodies and query strings can contain health data or sign-in tokens.
 */
export const DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: false,
} as const;
