import { describe, expect, it } from "vitest";
import { MEAL_PLAN_BY_SLUG, MEAL_PLAN_PAGES } from "../../src/content/meal-plans";
import { BY_SLUG, matches, sampleWeek } from "../../src/lib/library";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const week = (slug: string) => {
  const p = MEAL_PLAN_BY_SLUG.get(slug)!;
  return sampleWeek(p.filter, p.prefer).flatMap((d) => MEALS.map((m) => d[m]));
};

describe("meal-plan landing pages", () => {
  it("have unique, search-friendly titles and descriptions", () => {
    expect(new Set(MEAL_PLAN_PAGES.map((p) => p.metaTitle)).size).toBe(MEAL_PLAN_PAGES.length);
    expect(new Set(MEAL_PLAN_PAGES.map((p) => p.description)).size).toBe(MEAL_PLAN_PAGES.length);
    for (const p of MEAL_PLAN_PAGES) {
      expect(p.description.length, p.slug).toBeLessThanOrEqual(160);
      expect(p.metaTitle.length, p.slug).toBeLessThanOrEqual(60);
    }
  });

  it("only feature recipes that exist", () => {
    for (const p of MEAL_PLAN_PAGES) for (const s of p.prefer ?? []) expect(BY_SLUG.has(s), `${p.slug}: ${s}`).toBe(true);
  });

  it("build a 7-day example that respects the page filter, with no dish twice in a day", () => {
    for (const p of MEAL_PLAN_PAGES) {
      const days = sampleWeek(p.filter, p.prefer);
      expect(days).toHaveLength(7);
      for (const d of days) {
        const slugs = MEALS.map((m) => d[m].slug);
        expect(new Set(slugs).size, `${p.slug}: ${slugs.join(", ")}`).toBe(4);
        for (const m of MEALS) {
          expect(d[m].mealTypes).toContain(m);
          expect(matches(d[m], p.filter), `${p.slug}: ${d[m].slug}`).toBe(true);
        }
      }
    }
  });

  it("match what each page's text promises", () => {
    expect(week("vegan").every((r) => r.pattern === "vegan")).toBe(true);
    expect(week("vegetarian").every((r) => ["vegan", "vegetarian"].includes(r.pattern))).toBe(true);
    expect(week("budget-friendly").every((r) => r.costTier === 1)).toBe(true);
    // "This example week is all Nigerian favourites" (main meals and snacks).
    expect(week("nigerian").filter((r) => r.mealTypes.includes("snack") === false).every((r) => r.cuisine === "Nigerian")).toBe(true);
    // Indian: "one chicken tikka dinner", otherwise vegetarian.
    const indian = week("indian");
    expect(indian.filter((r) => !["vegan", "vegetarian"].includes(r.pattern)).map((r) => r.slug)).toEqual(["chicken-tikka-rice"]);
    // Mediterranean: fish or seafood at least twice in the week.
    expect(week("mediterranean").filter((r) => r.pattern === "pescatarian").length).toBeGreaterThanOrEqual(2);
  });
});
