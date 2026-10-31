import { expect, test } from "@playwright/test";

test("meal-plan pages show an example week that links to recipes", async ({ page }) => {
  await page.goto("/meal-plans");
  await page.getByRole("link", { name: "Healthy Nigerian meal plan" }).click();
  await expect(page).toHaveURL(/\/meal-plans\/nigerian$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Healthy Nigerian meal plan");
  await expect(page.getByRole("region", { name: /day$/i }).or(page.locator("section[aria-label$='day']"))).toHaveCount(7);
  await page.locator("section[aria-label='Monday'] a").first().click();
  await expect(page).toHaveURL(/\/recipes\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { name: "Method" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
});

test("recipe pages show allergens and the source of nutrition", async ({ page }) => {
  await page.goto("/recipes/tofu-bibimbap");
  await expect(page.getByText(/Contains:.*Soy.*Sesame/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nutrition per serving" })).toBeVisible();
  await expect(page.getByText(/USDA/).first()).toBeVisible();
  expect((await page.request.get("/recipes/not-a-recipe")).status()).toBe(404);
});

test("sitemap includes meal-plan and recipe pages; pages carry breadcrumbs data", async ({ page, request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/meal-plans/vegan");
  expect(sitemap).toContain("/recipes/jollof-rice-chicken");
  await page.goto("/meal-plans/vegan");
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("BreadcrumbList");
});
