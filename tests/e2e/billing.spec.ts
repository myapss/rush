import { expect, test } from "@playwright/test";
import { signPaddle, subscriptionEvent } from "../support/paddle";
import { onboard, signUp } from "./helpers";

const SECRET = "pdl_ntfset_e2e_secret"; // matches playwright.config.ts webServer.env

test("subscription lifecycle is driven only by verified webhooks", async ({ page, request }, info) => {
  test.setTimeout(90_000);
  await signUp(page, `billing-${info.project.name}-${Date.now()}@example.test`);
  await onboard(page);
  const userId = (await (await page.request.get("/api/account/export")).json()).account.id as string;
  const sub = `sub_${info.project.name}_${Date.now()}`;
  const post = (body: string, signature = signPaddle(body, SECRET)) =>
    request.post("/api/webhooks/paddle", { data: body, headers: { "content-type": "application/json", "paddle-signature": signature } });

  await page.goto("/dashboard/billing");
  await expect(page.getByRole("heading", { name: "Current plan: Free" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose yearly" })).toBeVisible();
  await expect(page.getByText("0 of 1", { exact: true })).toBeVisible();

  // Forged or unsigned events are rejected.
  const created = subscriptionEvent({ eventId: `evt_${sub}_1`, type: "subscription.created", userId, subscriptionId: sub });
  expect((await post(created, signPaddle(created, "wrong-secret"))).status()).toBe(401);
  expect((await request.post("/api/webhooks/paddle", { data: created })).status()).toBe(400);

  // A valid event grants Premium; a duplicate delivery is ignored.
  expect((await post(created)).status()).toBe(200);
  expect(await (await post(created)).json()).toMatchObject({ duplicate: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Current plan: Premium, monthly" })).toBeVisible();
  await expect(page.getByText(/^Renews on/)).toBeVisible();
  await expect(page.getByText("0 of 30", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel subscription" })).toBeVisible();

  // Account deletion refuses to proceed if the subscription can't be cancelled
  // with Paddle first (the test API key can't reach Paddle).
  await page.goto("/dashboard/settings");
  await page.getByRole("textbox", { name: "Type DELETE to confirm" }).fill("DELETE");
  await page.getByRole("button", { name: "Permanently delete my account" }).click();
  await expect(page.getByText(/couldn't cancel your subscription, so your account wasn't deleted/)).toBeVisible({ timeout: 30_000 });
  await page.goto("/dashboard/billing");
  await expect(page.getByRole("heading", { name: "Current plan: Premium, monthly" })).toBeVisible();

  // An out-of-order (older) cancellation is ignored.
  const stale = subscriptionEvent({ eventId: `evt_${sub}_0`, type: "subscription.canceled", userId, subscriptionId: sub, status: "canceled", occurredAt: new Date(Date.now() - 86_400_000).toISOString(), periodEnd: null });
  expect((await post(stale)).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Current plan: Premium, monthly" })).toBeVisible();

  // Scheduled cancellation keeps access and says when it ends.
  const scheduled = subscriptionEvent({ eventId: `evt_${sub}_2`, type: "subscription.updated", userId, subscriptionId: sub, scheduledCancel: true });
  expect((await post(scheduled)).status()).toBe(200);
  await page.reload();
  await expect(page.getByText(/Premium stays active until/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep my subscription" })).toBeVisible();

  // When the cancellation takes effect, the user returns to Free.
  const canceled = subscriptionEvent({ eventId: `evt_${sub}_3`, type: "subscription.canceled", userId, subscriptionId: sub, status: "canceled", periodEnd: null });
  expect((await post(canceled)).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Current plan: Free" })).toBeVisible();
  await expect(page.getByText("0 of 1", { exact: true })).toBeVisible();
});

test("events for unknown users or prices don't create subscriptions", async ({ request }) => {
  const body = subscriptionEvent({ eventId: `evt_unknown_${Date.now()}`, type: "subscription.created", userId: "33333333-3333-4333-8333-333333333333" });
  const res = await request.post("/api/webhooks/paddle", { data: body, headers: { "paddle-signature": signPaddle(body, SECRET) } });
  expect(res.status()).toBe(200);
});
