import { Paddle } from "@paddle/paddle-node-sdk";
import { describe, expect, it } from "vitest";
import { toSubscriptionRow, type PaddleSubscriptionData } from "../../src/lib/billing/subscription-events";
import { signPaddle, subscriptionEvent } from "../support/paddle";

const SECRET = "pdl_ntfset_test_secret";
const USER = "11111111-1111-4111-8111-111111111111";
const paddle = new Paddle("test_key");

describe("Paddle webhook fixtures", () => {
  it("are accepted by the official SDK and map to a subscription row", async () => {
    const body = subscriptionEvent({ eventId: "evt_1", type: "subscription.created", userId: USER, scheduledCancel: true });
    const event = await paddle.webhooks.unmarshal(body, SECRET, signPaddle(body, SECRET));
    expect(event.eventType).toBe("subscription.created");
    const mapped = toSubscriptionRow(event.data as unknown as PaddleSubscriptionData, event.occurredAt, { monthly: "pri_test_monthly", yearly: "pri_test_yearly" }, null);
    expect(mapped).toMatchObject({ ok: true, row: { user_id: USER, plan: "premium_monthly", provider_customer_id: "ctm_test_1", cancel_at_period_end: true } });
  });

  it("rejects a tampered body or wrong secret", async () => {
    const body = subscriptionEvent({ eventId: "evt_2", type: "subscription.created", userId: USER });
    const sig = signPaddle(body, SECRET);
    await expect(paddle.webhooks.unmarshal(body.replace(USER, "22222222-2222-4222-8222-222222222222"), SECRET, sig)).rejects.toThrow();
    await expect(paddle.webhooks.unmarshal(body, "other_secret", sig)).rejects.toThrow();
  });

  it("rejects stale signatures (replay protection)", async () => {
    const body = subscriptionEvent({ eventId: "evt_3", type: "subscription.created", userId: USER });
    const old = signPaddle(body, SECRET, Math.floor(Date.now() / 1000) - 3600);
    await expect(paddle.webhooks.unmarshal(body, SECRET, old)).rejects.toThrow();
  });
});
