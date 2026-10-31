import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage explains the product and links to signup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Meal plans that fit your goals");
  await page.getByRole("link", { name: "Create my meal plan" }).first().click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("calorie calculator gives an estimate with macros", async ({ page }) => {
  await page.goto("/calorie-calculator");
  await page.getByRole("button", { name: "Calculate" }).click();
  // 30-year-old female, 165 cm, 65 kg, light activity, maintain → TDEE ≈ 1884, target rounds to 1,890
  await expect(page.getByText("Daily calories", { exact: true })).toBeVisible();
  await expect(page.getByText("1,890", { exact: true })).toBeVisible();
  await expect(page.getByText("Protein", { exact: true }).first()).toBeVisible();
});

test("calculator refuses targets for under-18s", async ({ page }) => {
  await page.goto("/calorie-calculator");
  await page.getByLabel("Age").fill("16");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText(/designed for adults/)).toBeVisible();
  await expect(page.getByText("Daily calories", { exact: true })).toHaveCount(0);
});

test("calculator supports imperial units", async ({ page }) => {
  await page.goto("/bmi-calculator");
  await page.getByLabel("Imperial (lb, ft/in)").check();
  await page.getByLabel("Height (ft)").fill("5");
  await page.getByLabel("(in)").fill("10");
  await page.getByLabel("Weight (lb)").fill("160");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("23.0", { exact: true })).toBeVisible();
  await expect(page.getByText(/lb–\d+ lb/)).toBeVisible();
});

test("private pages are excluded from search and require login", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/calorie-calculator");
  expect(sitemap).not.toContain("/dashboard");

  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fsettings/);
});

for (const path of ["/", "/calorie-calculator", "/pricing", "/signup"]) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
}
