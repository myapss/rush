import type { Metadata } from "next";
import { Suspense } from "react";
import { AwaitActivation, CancelSubscriptionForm, CheckoutButton, ResumeSubscriptionForm } from "@/components/billing-controls";
import { openBillingPortal } from "@/lib/actions/billing";
import { requireUser } from "@/lib/auth";
import { billingConfig } from "@/lib/billing/config";
import { getSubscriptionRow } from "@/lib/billing/sync";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Plan & billing" };

// The AI recipe generator isn't built yet, so its quota isn't shown.
const FEATURE_LABEL = { meal_plan: "Meal plans", substitution: "Meal swaps" } as const;
const PLAN_LABEL = { premium_monthly: "Premium, monthly", premium_yearly: "Premium, yearly" } as const;

export default function BillingPage({ searchParams }: PageProps<"/dashboard/billing">) {
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Plan & billing</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Billing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }) : "–");

async function Billing({ searchParams }: { searchParams: PageProps<"/dashboard/billing">["searchParams"] }) {
  const user = await requireUser("/dashboard/billing");
  const sp = await searchParams;
  const supabase = await createClient();
  const [sub, { data: tier }, ...quotas] = await Promise.all([
    getSubscriptionRow(user.id),
    supabase.rpc("my_tier"),
    ...(["meal_plan", "substitution"] as const).map((f) => supabase.rpc("quota_status", { p_feature: f }).maybeSingle().then((r) => ({ feature: f, q: r.data }))),
  ]);
  const premium = tier === "premium";
  const config = billingConfig();
  const live = sub && sub.status !== "canceled";

  return (
    <>
      {sp.checkout === "success" && <AwaitActivation active={premium} />}
      {sp.portal === "error" && <p className="notice">We couldn&apos;t open the billing portal. Please try again.</p>}

      <section aria-labelledby="current-h" className="card grid gap-3">
        <h2 id="current-h" className="text-lg font-bold">
          Current plan: {premium && sub ? PLAN_LABEL[sub.plan] : "Free"}
        </h2>
        {sub && live && sub.status === "past_due" && (
          <p className="notice">
            Your last payment didn&apos;t go through. Paddle will retry it; please update your payment method to keep Premium.
          </p>
        )}
        {sub && live && sub.status === "paused" && <p className="notice">Your subscription is paused, so you&apos;re on the Free plan for now.</p>}
        {sub && live && !sub.cancel_at_period_end && sub.status !== "paused" && (
          <p className="text-muted">Renews on {date(sub.current_period_end)}. You can cancel any time.</p>
        )}
        {sub && sub.cancel_at_period_end && live && (
          <p className="text-muted">Cancelled. Premium stays active until {date(sub.current_period_end)}, then you&apos;ll move to Free.</p>
        )}
        {sub && sub.status === "canceled" && premium && <p className="text-muted">Cancelled. Premium ends on {date(sub.current_period_end)}.</p>}

        {sub && config && (
          <div className="flex flex-wrap items-start gap-2">
            {live && !sub.cancel_at_period_end && sub.status !== "paused" && <CancelSubscriptionForm endsOn={date(sub.current_period_end)} />}
            {live && sub.cancel_at_period_end && <ResumeSubscriptionForm />}
            <form action={openBillingPortal}>
              <button type="submit" className="btn">
                Manage payment &amp; invoices
              </button>
            </form>
          </div>
        )}
      </section>

      <section aria-labelledby="usage-h" className="card">
        <h2 id="usage-h" className="mb-3 text-lg font-bold">
          Usage this month
        </h2>
        <ul className="grid gap-3">
          {quotas.map(({ feature, q }) => {
            if (!q) return null;
            const pct = Math.min(100, Math.round((q.used / Math.max(q.monthly_limit, 1)) * 100));
            return (
              <li key={feature}>
                <div className="flex justify-between text-sm">
                  <span>{FEATURE_LABEL[feature]}</span>
                  <span className="tabular-nums text-muted">
                    {q.used} of {q.monthly_limit}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-2" role="progressbar" aria-valuenow={q.used} aria-valuemin={0} aria-valuemax={q.monthly_limit} aria-label={FEATURE_LABEL[feature]}>
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-danger" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        {quotas[0]?.q && <p className="mt-3 text-sm text-muted">Limits reset on {date(quotas[0].q.resets_at)}.</p>}
      </section>

      {!premium && (
        <section aria-labelledby="upgrade-h" className="grid gap-3">
          <h2 id="upgrade-h" className="text-lg font-bold">
            Upgrade to Premium
          </h2>
          {config ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card grid gap-3">
                <p>
                  <span className="text-3xl font-extrabold">$9.99</span> <span className="text-muted">per month</span>
                </p>
                <CheckoutButton plan="monthly" label="Choose monthly" />
              </div>
              <div className="card grid gap-3 border-brand">
                <p>
                  <span className="text-3xl font-extrabold">$59.99</span> <span className="text-muted">per year</span>
                  <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Save 50%</span>
                </p>
                <CheckoutButton plan="yearly" label="Choose yearly" primary />
              </div>
            </div>
          ) : (
            <p className="card text-muted">Premium isn&apos;t available to buy yet. We&apos;ll let you know when it launches.</p>
          )}
          <p className="text-sm text-muted">
            Premium includes 30 meal plans and 300 meal swaps a month (Free: 1 plan and 5 swaps). Payments are processed by
            Paddle, our reseller and merchant of record, which shows prices in your local currency and handles sales tax and
            VAT. Cancel any time and keep Premium until the end of the period you&apos;ve paid for.
          </p>
        </section>
      )}
    </>
  );
}
