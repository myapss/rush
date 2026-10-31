import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { onboard, signUp } from "./helpers";

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const path of ["/tdee-calculator", "/protein-calculator", "/bmi-calculator", "/food-database", "/privacy", "/login", "/meal-plans", "/meal-plans/high-protein", "/recipes", "/recipes/moi-moi"]) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test("no serious accessibility violations on signed-in pages", async ({ page }, info) => {
  test.setTimeout(120_000);
  await signUp(page, `a11y-${info.project.name}-${Date.now()}@example.test`);
  await onboard(page);
  await page.goto("/dashboard/my-meals");
  await page.getByRole("button", { name: "Create my 7-day plan" }).click();
  await expect(page.getByText("Planned automatically")).toBeVisible({ timeout: 60_000 });

  const pages: [string, RegExp | string][] = [
    ["/dashboard", "Daily targets"],
    ["/dashboard/my-meals", "Planned automatically"],
    ["/dashboard/grocery-list", /ticked/],
    ["/dashboard/recipes", /found/],
    ["/dashboard/recipes/generate", "Your AI recipes"],
    ["/dashboard/progress", "Add an entry"],
    ["/dashboard/billing", "Usage this month"],
    ["/dashboard/settings", "Your data"],
  ];
  const problems: string[] = [];
  for (const [path, ready] of pages) {
    await page.goto(path);
    await expect(page.getByText(ready).first()).toBeVisible();
    for (const v of await seriousViolations(page)) problems.push(`${path} → ${v}`);
  }
  await page.goto("/dashboard/recipes");
  await page.locator("main a[href^='/dashboard/recipes/']:not([href$='/generate'])").first().click();
  await expect(page.getByRole("heading", { name: "Method" })).toBeVisible();
  for (const v of await seriousViolations(page)) problems.push(`recipe detail → ${v}`);
  expect(problems).toEqual([]);
});
