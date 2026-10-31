"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { cancelSubscription, resumeSubscription, startCheckout, type ManageState } from "@/lib/actions/billing";

export function CheckoutButton({ plan, label, primary = false }: { plan: "monthly" | "yearly"; label: string; primary?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const r = await startCheckout(plan);
      if (!r.ok) return setError(r.message);
      const paddle = await initializePaddle({
        environment: r.environment,
        token: r.clientToken,
        eventCallback: (e) => {
          // Only a hint for the UI: Premium is granted by the verified webhook.
          if (e.name === "checkout.completed") router.push("/dashboard/billing?checkout=success");
        },
      });
      if (!paddle) return setError("Checkout couldn't load. Please check your connection and try again.");
      paddle.Checkout.open({ transactionId: r.transactionId, ...(r.email ? { customer: { email: r.email } } : {}) });
    });
  }

  return (
    <div className="grid gap-2">
      <button type="button" className={`btn ${primary ? "btn-primary" : ""}`} onClick={onClick} disabled={pending}>
        {pending ? "Opening checkout…" : label}
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function CancelSubscriptionForm({ endsOn }: { endsOn: string }) {
  const [state, action, pending] = useActionState<ManageState, FormData>(cancelSubscription, { status: "idle" });
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger w-fit" onClick={() => setConfirming(true)}>
        Cancel subscription
      </button>
    );
  }
  return (
    <form action={action} className="grid gap-2 rounded-xl border border-border p-3">
      <p className="text-sm">
        You&apos;ll keep Premium until <strong>{endsOn}</strong>, then move to the Free plan. You won&apos;t be charged again.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-danger" disabled={pending}>
          {pending ? "Cancelling…" : "Confirm cancellation"}
        </button>
        <button type="button" className="btn" onClick={() => setConfirming(false)}>
          Keep Premium
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="error-text">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function ResumeSubscriptionForm() {
  const [state, action, pending] = useActionState<ManageState, FormData>(resumeSubscription, { status: "idle" });
  return (
    <form action={action} className="grid gap-2">
      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Updating…" : "Keep my subscription"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="error-text">
          {state.message}
        </p>
      )}
    </form>
  );
}

/** After checkout, re-check for the webhook-confirmed subscription for up to a minute. */
export function AwaitActivation({ active }: { active: boolean }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (active || tries >= 20) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [active, tries, router]);
  if (active) return <p className="card border-brand bg-brand-soft" role="status">Thank you! Premium is now active.</p>;
  return (
    <p className="notice" role="status">
      {tries < 20
        ? "Thanks! We're confirming your payment with Paddle. This usually takes a few seconds…"
        : "Your payment is still being confirmed. You'll receive an email receipt from Paddle; refresh this page in a minute, or contact us if Premium doesn't appear."}
    </p>
  );
}
