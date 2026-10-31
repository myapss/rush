import { createHmac } from "node:crypto";

/** Build a Paddle-style webhook body (test fixture, not real billing data). */
export function subscriptionEvent(opts: {
  eventId: string;
  type: string;
  userId: string;
  subscriptionId?: string;
  status?: "active" | "canceled" | "past_due" | "paused" | "trialing";
  priceId?: string;
  occurredAt?: string;
  periodEnd?: string | null;
  scheduledCancel?: boolean;
}) {
  const now = opts.occurredAt ?? new Date().toISOString();
  const end = opts.periodEnd === undefined ? new Date(Date.now() + 30 * 86_400_000).toISOString() : opts.periodEnd;
  const price = {
    id: opts.priceId ?? "pri_test_monthly", product_id: "pro_test", description: "Premium monthly", type: "standard", name: "Premium",
    billing_cycle: { interval: "month", frequency: 1 }, trial_period: null, tax_mode: "account_setting",
    unit_price: { amount: "999", currency_code: "USD" }, unit_price_overrides: [], quantity: { minimum: 1, maximum: 1 },
    status: "active", custom_data: null, import_meta: null, created_at: now, updated_at: now,
  };
  return JSON.stringify({
    event_id: opts.eventId,
    event_type: opts.type,
    occurred_at: now,
    notification_id: `ntf_${opts.eventId}`,
    data: {
      id: opts.subscriptionId ?? "sub_test_1",
      status: opts.status ?? "active",
      customer_id: "ctm_test_1",
      address_id: "add_test_1",
      business_id: null,
      currency_code: "USD",
      created_at: now,
      updated_at: now,
      started_at: now,
      first_billed_at: now,
      next_billed_at: end,
      paused_at: null,
      canceled_at: opts.status === "canceled" ? now : null,
      discount: null,
      collection_mode: "automatic",
      billing_details: null,
      current_billing_period: end ? { starts_at: now, ends_at: end } : null,
      billing_cycle: { interval: "month", frequency: 1 },
      scheduled_change: opts.scheduledCancel ? { action: "cancel", effective_at: end, resume_at: null } : null,
      items: [{ status: "active", quantity: 1, recurring: true, created_at: now, updated_at: now, previously_billed_at: now, next_billed_at: end, trial_dates: null, price, product: null }],
      custom_data: { user_id: opts.userId },
      import_meta: null,
    },
  });
}

/** Paddle-Signature header: ts=<unix seconds>;h1=HMAC-SHA256(secret, "<ts>:<body>"). */
export function signPaddle(body: string, secret: string, ts = Math.floor(Date.now() / 1000)) {
  const h1 = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  return `ts=${ts};h1=${h1}`;
}
