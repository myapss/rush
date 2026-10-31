import type { Database } from "@/lib/supabase/database.types";

type Row = Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionUpsert = Database["public"]["Tables"]["subscriptions"]["Insert"];

/** The parts of a Paddle subscription notification we use. */
export interface PaddleSubscriptionData {
  id: string;
  status: "active" | "canceled" | "past_due" | "paused" | "trialing";
  customerId: string;
  currencyCode: string;
  canceledAt: string | null;
  currentBillingPeriod: { endsAt: string } | null;
  scheduledChange: { action: string; effectiveAt: string } | null;
  items: { price: { id: string } | null }[];
  customData: Record<string, unknown> | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MapResult =
  | { ok: true; row: SubscriptionUpsert }
  | { ok: false; reason: "unknown_user" | "unknown_price" };

/**
 * Convert a Paddle subscription event into our subscriptions row.
 * `userId` comes from custom_data set by our server when it created the
 * checkout transaction, or from an existing row for this subscription.
 */
export function toSubscriptionRow(
  data: PaddleSubscriptionData,
  occurredAt: string,
  prices: { monthly: string; yearly: string },
  existingUserId: string | null,
): MapResult {
  const fromCustomData = typeof data.customData?.user_id === "string" && UUID.test(data.customData.user_id) ? data.customData.user_id : null;
  const userId = existingUserId ?? fromCustomData;
  if (!userId) return { ok: false, reason: "unknown_user" };

  const priceId = data.items.find((i) => i.price)?.price?.id ?? null;
  const plan = priceId === prices.yearly ? "premium_yearly" : priceId === prices.monthly ? "premium_monthly" : null;
  if (!plan) return { ok: false, reason: "unknown_price" };

  return {
    ok: true,
    row: {
      user_id: userId,
      provider: "paddle",
      provider_customer_id: data.customerId,
      provider_subscription_id: data.id,
      status: data.status,
      plan,
      price_id: priceId,
      currency: /^[A-Z]{3}$/.test(data.currencyCode) ? data.currencyCode : null,
      // When canceled, access ends when the cancellation took effect.
      current_period_end: data.currentBillingPeriod?.endsAt ?? data.canceledAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      last_event_at: occurredAt,
    },
  };
}

const GRANTS_ACCESS = new Set(["active", "trialing", "past_due"]);

/** Decide whether an incoming event should overwrite the user's current row. */
export function shouldApply(existing: Pick<Row, "provider_subscription_id" | "status" | "last_event_at"> | null, incoming: SubscriptionUpsert): boolean {
  if (!existing) return true;
  if (existing.provider_subscription_id === incoming.provider_subscription_id) {
    // Same subscription: ignore events older than the one already applied.
    return !existing.last_event_at || !incoming.last_event_at || new Date(incoming.last_event_at) >= new Date(existing.last_event_at);
  }
  // A different subscription: don't let a late event for an old, ended
  // subscription replace one that currently grants access.
  return !(GRANTS_ACCESS.has(existing.status) && !GRANTS_ACCESS.has(incoming.status));
}
