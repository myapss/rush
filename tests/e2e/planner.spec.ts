import { expect, test } from "@playwright/test";
import { onboard, signUp } from "./helpers";

test.describe.configure({ mode: "serial" });

test("plan, swap, shop, cook and track", async ({ page }, info) => {
  test.setTimeout(120_000);
  await signUp(page, `planner-${info.project.name}-${Date.now()}@example.test`);
  await onboard(page, { allergies: ["Peanuts"], mealsPerDay: "4" });

  // Generate a plan (no ANTHROPIC_API_KEY in tests, so the rules planner runs).
  await page.getByRole("button", { name: "Create my 7-day plan" }).click();
  await expect(page).toHaveURL(/\/dashboard\/my-meals$/, { timeout: 60_000 });
  await expect(page.getByText("Planned automatically")).toBeVisible();
  const days = page.locator("section[aria-label]").filter({ has: page.getByRole("heading", { level: 2 }) });
  await expect(days).toHaveCount(7);
  await expect(page.getByRole("button", { name: /^Swap / })).toHaveCount(28);

  // The peanut allergy is respected everywhere in the plan.
  await expect(days.getByText(/Peanut/i)).toHaveCount(0);

  // Swap the first meal: it changes to a different recipe.
  const firstMeal = days.first().locator("li").first();
  const before = await firstMeal.getByRole("link").textContent();
  await firstMeal.getByRole("button", { name: /^Swap / }).click();
  await expect(firstMeal.getByRole("link")).not.toHaveText(before!, { timeout: 15_000 });
  await expect(days.getByText(/Peanut/i)).toHaveCount(0);

  // Free plan allows one plan per month.
  await page.getByRole("button", { name: "New plan" }).click();
  await expect(page.getByText("You've used all your meal plans for this month.")).toBeVisible({ timeout: 30_000 });

  // Recipe detail shows ingredients and method, scaled to the planned servings.
  await firstMeal.getByRole("link").click();
  await expect(page.getByRole("heading", { name: "Method" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Ingredients/ })).toBeVisible();
  await page.getByRole("button", { name: "☆ Save recipe" }).click();
  await expect(page.getByRole("button", { name: "★ Saved" })).toBeVisible();

  // Shopping list: grouped, tickable, editable and scalable.
  await page.goto("/dashboard/grocery-list");
  await expect(page.getByRole("heading", { name: "Shopping list" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Grains & bakery" })).toBeVisible();
  const rice = page.locator("li", { hasText: "TEST rice" });
  const riceAmount = await rice.locator("span.tabular-nums").textContent();
  await rice.getByRole("checkbox").check();
  await page.reload();
  await expect(page.locator("li", { hasText: "TEST rice" }).getByRole("checkbox")).toBeChecked();
  await page.getByLabel("People").selectOption("2");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.locator("li", { hasText: "TEST rice" }).locator("span.tabular-nums")).not.toHaveText(riceAmount!);
  await page.getByLabel("Add an item").fill("Washing-up liquid");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Washing-up liquid")).toBeVisible();
  await page.getByRole("button", { name: "Remove Washing-up liquid" }).click();
  await expect(page.getByText("Washing-up liquid")).toHaveCount(0);

  // Progress: two weigh-ins draw a trend chart; entries can be deleted.
  await page.goto("/dashboard/progress");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Save entry" }) });
  await form.getByLabel("Date").fill("2026-10-20");
  await form.getByLabel("Weight (kg)").fill("74.2");
  await form.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await form.getByLabel("Date").fill("2026-10-27");
  await form.getByLabel("Weight (kg)").fill("73.6");
  await form.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("img", { name: /Weight over time/ })).toBeVisible();
  await page.getByRole("button", { name: "Delete entry for 2026-10-20" }).click();
  await expect(page.getByRole("button", { name: "Delete entry for 2026-10-20" })).toHaveCount(0);

  // Overview shows today's meals.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Today's meals" })).toBeVisible();
  await expect(page.getByText(/^Today:/)).toBeVisible();
});

test("public food database lists foods with their source", async ({ page }) => {
  await page.goto("/food-database?q=TEST");
  await expect(page.getByRole("cell", { name: /TEST rice/ })).toBeVisible();
});
