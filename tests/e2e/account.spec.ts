import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.describe.configure({ mode: "serial" });

test("signup requires age confirmation", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("young@example.test");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Please confirm you are 18 or older/)).toBeVisible();
});

test("full account lifecycle: signup, onboarding, targets, settings, export, delete", async ({ page }, info) => {
  const email = `e2e-${info.project.name}-${Date.now()}@example.test`;
  await signUp(page, email);

  // New users are sent to onboarding before the dashboard.
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Country or region").selectOption("NG");
  await page.getByLabel("Currency for budgets").selectOption("NGN");
  await page.getByLabel("Birth year").fill(String(new Date().getUTCFullYear() - 15));
  await page.getByLabel("Height (cm)").fill("170");
  await page.getByLabel("Weight (kg)").fill("72");
  await page.getByRole("button", { name: "Save and continue" }).click();

  // Under-18 and missing consent are both rejected.
  await expect(page.getByText("ChopPlanner is for adults aged 18 and over.")).toBeVisible();
  await expect(page.getByText(/please give consent below/)).toBeVisible();

  await page.getByLabel("Birth year").fill("1990");
  await page.getByLabel(/I consent to ChopPlanner storing/).check();
  await page.getByRole("checkbox", { name: "Peanuts", exact: true }).check();
  await page.getByRole("checkbox", { name: "Nigerian", exact: true }).check();
  await page.getByLabel("Goal").selectOption("lose");
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Daily targets" })).toBeVisible();
  await expect(page.getByText("Calories", { exact: true })).toBeVisible();
  await expect(page.locator("dd", { hasText: "Peanuts" })).toBeVisible();
  await expect(page.getByText(/0 of 1 meal plans used/)).toBeVisible();

  // Withdrawing consent removes health data and targets.
  await page.getByRole("link", { name: "Settings" }).first().click();
  await page.getByRole("checkbox", { name: /I consent to ChopPlanner storing/ }).uncheck();
  await page.getByRole("spinbutton", { name: "Height (cm)" }).fill("");
  await page.getByRole("spinbutton", { name: "Weight (kg)" }).fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");

  // Export contains only this user's data.
  const res = await page.request.get("/api/account/export");
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.account.email).toBe(email);
  expect(data.profiles).toHaveLength(1);
  expect(data.profiles[0].weight_kg).toBeNull();
  expect(data.profiles[0].health_data_consent_at).toBeNull();
  expect(data.user_preferences[0].allergies).toEqual(["peanut"]);

  await page.goto("/dashboard");
  await expect(page.getByText(/Add your height and weight/)).toBeVisible();

  // Delete the account.
  await page.goto("/dashboard/settings");
  await page.getByRole("textbox", { name: "Type DELETE to confirm" }).fill("DELETE");
  await page.getByRole("button", { name: "Permanently delete my account" }).click();
  await expect(page).toHaveURL(/\/\?account=deleted$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("signed-out export is rejected", async ({ request }) => {
  expect((await request.get("/api/account/export")).status()).toBe(401);
});
