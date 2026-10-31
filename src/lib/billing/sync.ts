import "server-only";
import type { Subscription } from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingConfig } from "./config";
import { toSubscriptionRow, type PaddleSubscriptionData } from "./subscription-events";

/**
 * Store a subscription returned by the Paddle API (server-to-server, so it
 * can be trusted) right away, instead of waiting for the webhook.
 */
export async function syncFromApi(sub: Subscription, userId: string, config: BillingConfig) {
  const mapped = toSubscriptionRow(sub as unknown as PaddleSubscriptionData, sub.updatedAt, { monthly: config.PADDLE_PRICE_MONTHLY_ID, yearly: config.PADDLE_PRICE_YEARLY_ID }, userId);
  if (!mapped.ok) return;
  const { error } = await createAdminClient().from("subscriptions").upsert(mapped.row, { onConflict: "user_id" });
  if (error) console.error("subscription sync failed", error.message);
}

export async function getSubscriptionRow(userId: string) {
  const { data } = await createAdminClient().from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  return data;
}
