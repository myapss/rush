import { expect, test } from "@playwright/test";
import { onboard, signUp } from "./helpers";

test("AI recipe ideas respect allergies, are validated, and can be deleted", async ({ page }, info) => {
  test.setTimeout(120_000);
  await signUp(page, `recipes-${info.project.name}-${Date.now()}@example.test`);
  await onboard(page, { allergies: ["Peanuts"] });

  await page.goto("/dashboard/recipes");
  await page.getByRole("link", { name: /Create a recipe with AI/ }).click();
  await expect(page.getByRole("heading", { name: "AI recipe ideas" })).toBeVisible();
  await expect(page.getByText("0 of 3 AI recipe generations used this month.")).toBeVisible();

  await page.getByRole("textbox", { name: "Ingredients you have" }).fill("rice, beans, peanut butter, dragonfruit");
  await page.getByRole("combobox", { name: "Meal", exact: true }).selectOption("lunch");
  await page.getByRole("button", { name: "Create recipes" }).click();

  // The mock returns one valid idea and one with an unknown ingredient code, which must be rejected.
  await expect(page.getByText("Done! Your new recipe is below.")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Left out for your safety: TEST peanut butter \(because of your allergies\)/)).toBeVisible();
  await expect(page.getByText("Not in our food database yet: dragonfruit.")).toBeVisible();
  const mine = page.locator("section[aria-labelledby='mine-h']");
  await expect(mine.getByRole("link", { name: "TEST Mock bean and rice bowl" })).toBeVisible();
  await expect(mine.getByText("TEST Invalid idea")).toHaveCount(0);
  // Nutrition is computed from food data: (300×130 + 200×132 + 100×23) / 100 / 2 = 338.5 → 339 kcal.
  await expect(mine.getByText(/339 kcal/)).toBeVisible();
  await expect(page.getByText("1 of 3 AI recipe generations used this month.")).toBeVisible();

  await mine.getByRole("link", { name: "TEST Mock bean and rice bowl" }).click();
  await expect(page.getByText(/AI-generated recipe\./)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Substitutions" })).toBeVisible();
  await expect(page.getByText(/TEST beans.*instead of TEST spinach/)).toBeVisible();

  await page.getByRole("button", { name: "Delete recipe" }).click();
  await expect(page).toHaveURL(/\/dashboard\/recipes\/generate$/);
  await expect(page.getByText("Recipes you create will appear here.")).toBeVisible();
});
