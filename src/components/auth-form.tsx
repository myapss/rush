"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { sendMagicLink, signInWithGoogle, type AuthFormState } from "@/lib/actions/auth";
import { trackEvent } from "@/lib/consent";

export function AuthForm({ mode, next, googleEnabled }: { mode: "login" | "signup"; next: string; googleEnabled: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(sendMagicLink.bind(null, mode), { status: "idle" });

  useEffect(() => {
    if (state.status === "sent" && mode === "signup") trackEvent("sign_up", { method: "email" });
  }, [state.status, mode]);

  if (state.status === "sent") {
    return (
      <div className="card" role="status">
        <h2 className="mb-2 text-lg font-bold">Check your email</h2>
        <p className="text-muted">
          If {mode === "login" ? "an account exists for" : "everything is in order, we've sent a link to"}{" "}
          <strong className="text-fg">{state.email}</strong>
          {mode === "login" ? ", we've sent a sign-in link to it" : ""}. The link expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="card grid gap-5">
      <form action={action} className="grid gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <label className="label">
          Email
          <input className="input" type="email" name="email" autoComplete="email" required />
        </label>
        {mode === "signup" && (
          <div className="grid gap-2 text-sm">
            <label className="flex items-start gap-2">
              <input type="checkbox" name="ageConfirmed" className="mt-1 accent-[var(--brand)]" required />
              <span>I am 18 years old or older.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" name="termsAccepted" className="mt-1 accent-[var(--brand)]" required />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                , and understand NutriPlan AI is not medical advice.
              </span>
            </label>
          </div>
        )}
        {state.status === "error" && (
          <p role="alert" className="error-text">
            {state.message}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : mode === "login" ? "Email me a sign-in link" : "Create account"}
        </button>
      </form>
      {googleEnabled && (
        <form action={signInWithGoogle} className="grid gap-3">
          <input type="hidden" name="next" value={next} />
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <button type="submit" className="btn">
            Continue with Google
          </button>
        </form>
      )}
    </div>
  );
}
