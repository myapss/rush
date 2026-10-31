import { describe, expect, it } from "vitest";
import { shouldApply, toSubscriptionRow, type PaddleSubscriptionData } from "./subscription-events";

const prices = { monthly: "pri_month", yearly: "pri_year" };
const USER = "11111111-1111-4111-8111-111111111111";
const base: PaddleSubscriptionData = {
  id: "sub_1",
  status: "active",
  customerId: "ctm_1",
  currencyCode: "USD",
  canceledAt: null,
  currentBillingPeriod: { endsAt: "2026-12-01T00:00:00Z" },
  scheduledChange: null,
  items: [{ price: { id: "pri_month" } }],
  customData: { user_id: USER },
};

describe("toSubscriptionRow", () => {
  it("maps an active monthly subscription", () => {
    const r = toSubscriptionRow(base, "2026-11-01T00:00:00Z", prices, null);
    expect(r).toEqual({
      ok: true,
      row: expect.objectContaining({ user_id: USER, plan: "premium_monthly", status: "active", current_period_end: "2026-12-01T00:00:00Z", cancel_at_period_end: false }),
    });
  });

  it("detects yearly plans and scheduled cancellations", () => {
    const r = toSubscriptionRow({ ...base, items: [{ price: { id: "pri_year" } }], scheduledChange: { action: "cancel", effectiveAt: "2026-12-01T00:00:00Z" } }, "t", prices, null);
    expect(r.ok && r.row.plan).toBe("premium_yearly");
    expect(r.ok && r.row.cancel_at_period_end).toBe(true);
  });

  it("ends access at cancellation time once canceled", () => {
    const r = toSubscriptionRow({ ...base, status: "canceled", currentBillingPeriod: null, canceledAt: "2026-11-15T00:00:00Z" }, "t", prices, null);
    expect(r.ok && r.row.current_period_end).toBe("2026-11-15T00:00:00Z");
  });

  it("rejects unknown prices and events without a user", () => {
    expect(toSubscriptionRow({ ...base, items: [{ price: { id: "pri_other" } }] }, "t", prices, null)).toEqual({ ok: false, reason: "unknown_price" });
    expect(toSubscriptionRow({ ...base, customData: { user_id: "not-a-uuid" } }, "t", prices, null)).toEqual({ ok: false, reason: "unknown_user" });
  });

  it("prefers the user already linked to the subscription over custom data", () => {
    const other = "22222222-2222-4222-8222-222222222222";
    const r = toSubscriptionRow({ ...base, customData: { user_id: other } }, "t", prices, USER);
    expect(r.ok && r.row.user_id).toBe(USER);
  });
});

describe("shouldApply", () => {
  const row = (status: "active" | "canceled", sub = "sub_1", at = "2026-11-02T00:00:00Z") =>
    ({ user_id: USER, provider: "paddle", provider_customer_id: "c", provider_subscription_id: sub, status, plan: "premium_monthly", last_event_at: at }) as const;

  it("applies the first event", () => expect(shouldApply(null, row("active"))).toBe(true));
  it("ignores older events for the same subscription", () => {
    expect(shouldApply(row("active", "sub_1", "2026-11-02T00:00:00Z"), row("canceled", "sub_1", "2026-11-01T00:00:00Z"))).toBe(false);
    expect(shouldApply(row("active", "sub_1", "2026-11-02T00:00:00Z"), row("canceled", "sub_1", "2026-11-03T00:00:00Z"))).toBe(true);
  });
  it("doesn't let an old subscription's cancellation override a new active one", () => {
    expect(shouldApply(row("active", "sub_2"), row("canceled", "sub_1", "2026-12-01T00:00:00Z"))).toBe(false);
    expect(shouldApply(row("canceled", "sub_1"), row("active", "sub_2"))).toBe(true);
  });
});
