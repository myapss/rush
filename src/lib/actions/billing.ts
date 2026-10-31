"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { billingConfig } from "@/lib/billing/config";
import { paddleClient } from "@/lib/billing/paddle";
import { getSubscriptionRow, syncFromApi } from "@/lib/billing/sync";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type CheckoutResult =
  | { ok: true; transactionId: string; clientToken: string; environment: "sandbox" | "production"; email: string | null }
  | { ok: false; message: string };

/**
 * Create the checkout transaction on the server, so the user id attached to
 * the subscription can't be tampered with in the browser.
 */
export async function startCheckout(plan: "monthly" | "yearly"): Promise<CheckoutResult> {
  const user = await requireUser("/dashboard/billing");
  const config = billingConfig();
  if (!config) return { ok: false, message: "Payments aren't available yet." };
  if (plan !== "monthly" && plan !== "yearly") return { ok: false, message: "Unknown plan." };
  if (!(await rateLimit(`checkout:${user.id}`, 10, 3600))) return { ok: false, message: "Too many attempts. Please try again later." };

  const supabase = await createClient();
  const { data: tier } = await supabase.rpc("my_tier");
  if (tier === "premium") return { ok: false, message: "You already have Premium." };

  const existing = await getSubscriptionRow(user.id);
  try {
    const txn = await paddleClient(config).transactions.create({
      items: [{ priceId: plan === "yearly" ? config.PADDLE_PRICE_YEARLY_ID : config.PADDLE_PRICE_MONTHLY_ID, quantity: 1 }],
      customData: { user_id: user.id },
      customerId: existing?.provider_customer_id ?? null,
    });
    return { ok: true, transactionId: txn.id, clientToken: config.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN, environment: config.PADDLE_ENVIRONMENT, email: user.email };
  } catch (e) {
    console.error("Paddle transaction create failed", e);
    return { ok: false, message: "We couldn't start checkout. Please try again." };
  }
}

export type ManageState = { status: "idle" } | { status: "error"; message: string };

async function ownSubscription() {
  const user = await requireUser("/dashboard/billing");
  const config = billingConfig();
  const sub = await getSubscriptionRow(user.id);
  return { user, config, sub };
}

export async function cancelSubscription(_prev: ManageState, _fd: FormData): Promise<ManageState> {
  const { user, config, sub } = await ownSubscription();
  if (!config || !sub || sub.status === "canceled") return { status: "error", message: "There's no active subscription to cancel." };
  try {
    const updated = await paddleClient(config).subscriptions.cancel(sub.provider_subscription_id, { effectiveFrom: "next_billing_period" });
    await syncFromApi(updated, user.id, config);
  } catch (e) {
    console.error("Paddle cancel failed", e);
    return { status: "error", message: "We couldn't cancel right now. Please try again or use 'Manage payment & invoices'." };
  }
  refresh();
  return { status: "idle" };
}

export async function resumeSubscription(_prev: ManageState, _fd: FormData): Promise<ManageState> {
  const { user, config, sub } = await ownSubscription();
  if (!config || !sub || !sub.cancel_at_period_end) return { status: "error", message: "There's no scheduled cancellation to undo." };
  try {
    const updated = await paddleClient(config).subscriptions.update(sub.provider_subscription_id, { scheduledChange: null });
    await syncFromApi(updated, user.id, config);
  } catch (e) {
    console.error("Paddle resume failed", e);
    return { status: "error", message: "We couldn't keep your subscription active. Please try again." };
  }
  refresh();
  return { status: "idle" };
}

/** Paddle's hosted portal: payment methods, invoices and receipts. */
export async function openBillingPortal() {
  const { config, sub } = await ownSubscription();
  if (!config || !sub) redirect("/dashboard/billing");
  let url: string;
  try {
    const session = await paddleClient(config).customerPortalSessions.create(sub.provider_customer_id, [sub.provider_subscription_id]);
    url = session.urls.general.overview;
  } catch (e) {
    console.error("Paddle portal session failed", e);
    redirect("/dashboard/billing?portal=error");
  }
  redirect(url);
}
