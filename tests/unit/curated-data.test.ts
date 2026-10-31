import { describe, expect, it } from "vitest";
import { FOODS } from "../../data/foods";
import { RECIPES } from "../../data/recipes";
import { CUISINES } from "../../src/lib/reference";

describe("curated data integrity", () => {
  const slugs = new Set(FOODS.map((f) => f.slug));

  it("has unique food slugs and descriptions", () => {
    expect(slugs.size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => f.fdc.toLowerCase())).size).toBe(FOODS.length);
  });

  it("only references known foods with sensible amounts", () => {
    for (const r of RECIPES) {
      for (const [slug, grams] of r.ingredients) {
        expect(slugs.has(slug), `${r.slug} uses unknown food ${slug}`).toBe(true);
        expect(grams, `${r.slug}/${slug}`).toBeGreaterThan(0);
        expect(grams, `${r.slug}/${slug}`).toBeLessThanOrEqual(1000);
      }
      expect(r.steps.length).toBeGreaterThan(0);
      expect(r.mealTypes.length).toBeGreaterThan(0);
    }
  });

  it("has unique recipe slugs", () => {
    expect(new Set(RECIPES.map((r) => r.slug)).size).toBe(RECIPES.length);
  });

  it("tags animal foods with a non-vegan pattern", () => {
    for (const f of FOODS.filter((f) => ["meat_fish", "dairy_eggs"].includes(f.category) && !f.slug.startsWith("soy"))) {
      expect(f.pattern, f.slug).not.toBe("vegan");
    }
  });

  it("tags the obvious allergens", () => {
    const tagged = (slug: string) => FOODS.find((f) => f.slug === slug)?.allergens ?? [];
    expect(tagged("peanut_butter")).toContain("peanut");
    expect(tagged("tofu_firm")).toContain("soy");
    expect(tagged("soy_sauce")).toEqual(expect.arrayContaining(["soy", "gluten"]));
    expect(tagged("shrimp_raw")).toContain("shellfish");
    expect(tagged("hummus")).toContain("sesame");
    expect(tagged("egg")).toContain("egg");
  });

  it("covers every meal type for vegans", () => {
    const veganFoods = new Set(FOODS.filter((f) => f.pattern === "vegan").map((f) => f.slug));
    for (const type of ["breakfast", "lunch", "dinner", "snack"] as const) {
      const vegan = RECIPES.filter((r) => r.mealTypes.includes(type) && r.ingredients.every(([s]) => veganFoods.has(s)));
      expect(vegan.length, type).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses known cuisines where possible", () => {
    const known = new Set<string>([...CUISINES, "International", "Egyptian", "Latin American", "European"]);
    for (const r of RECIPES) expect(known.has(r.cuisine), r.cuisine).toBe(true);
  });
});
