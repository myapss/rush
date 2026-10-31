import { NextResponse, type NextRequest } from "next/server";
import { billingConfig } from "@/lib/billing/config";
import { paddleClient } from "@/lib/billing/paddle";
import { shouldApply, toSubscriptionRow, type PaddleSubscriptionData } from "@/lib/billing/subscription-events";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Paddle webhook receiver. The only place subscription state is written.
 * Every request must carry a valid Paddle-Signature; events are processed
 * at most once (billing_events primary key) and out-of-order deliveries are
 * ignored (see shouldApply).
 */
export async function POST(request: NextRequest) {
  const config = billingConfig();
  if (!config) return NextResponse.json({ error: "Billing not configured" }, { status: 503 });

  const signature = request.headers.get("paddle-signature");
  const body = await request.text();
  if (!signature || body.length > 1_000_000) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  let event;
  try {
    event = await paddleClient(config).webhooks.unmarshal(body, config.PADDLE_WEBHOOK_SECRET, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const db = createAdminClient();
  const { error: dupError } = await db
    .from("billing_events")
    .insert({ id: event.eventId, provider: "paddle", type: event.eventType, payload: JSON.parse(body) });
  if (dupError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (dupError) {
    console.error("billing_events insert failed", dupError.message);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  try {
    if (event.eventType.startsWith("subscription.")) {
      await handleSubscription(db, event.data as unknown as PaddleSubscriptionData, event.occurredAt, config);
    }
    await db.from("billing_events").update({ processed_at: new Date().toISOString() }).eq("id", event.eventId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Let Paddle retry: forget the event so the retry is processed.
    await db.from("billing_events").delete().eq("id", event.eventId);
    console.error("Paddle webhook processing failed", event.eventType, event.eventId, e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handleSubscription(
  db: ReturnType<typeof createAdminClient>,
  data: PaddleSubscriptionData,
  occurredAt: string,
  config: NonNullable<ReturnType<typeof billingConfig>>,
) {
  const { data: bySub } = await db.from("subscriptions").select("user_id").eq("provider_subscription_id", data.id).maybeSingle();
  const mapped = toSubscriptionRow(data, occurredAt, { monthly: config.PADDLE_PRICE_MONTHLY_ID, yearly: config.PADDLE_PRICE_YEARLY_ID }, bySub?.user_id ?? null);
  if (!mapped.ok) {
    // Not ours to act on (e.g. a price for another product). Logged, not retried.
    console.warn("Ignoring Paddle subscription event:", mapped.reason, data.id);
    return;
  }
  const { data: user } = await db.auth.admin.getUserById(mapped.row.user_id);
  if (!user?.user) {
    console.warn("Paddle subscription for unknown or deleted user", data.id);
    return;
  }

  const { data: existing } = await db
    .from("subscriptions")
    .select("provider_subscription_id, status, last_event_at")
    .eq("user_id", mapped.row.user_id)
    .maybeSingle();
  if (!shouldApply(existing, mapped.row)) return;

  const { error } = await db.from("subscriptions").upsert(mapped.row, { onConflict: "user_id" });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
}
