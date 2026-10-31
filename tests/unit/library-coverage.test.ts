import { describe, expect, it } from "vitest";
import { FOODS } from "../../data/foods";
import { RECIPES } from "../../data/recipes";
import { buildPools, insufficientPools, MIN_POOL } from "../../src/lib/planner/plan";
import { PATTERN_RANK } from "../../src/lib/planner/rules";
import { buildSlots } from "../../src/lib/planner/slots";
import type { Candidate, PlannerPrefs } from "../../src/lib/planner/types";

// Build planner candidates from the curated library. Nutrition isn't known
// until the USDA import, so a placeholder kcal is used: these tests only
// exercise the safety rules and recipe coverage, never nutrition.
const foods = new Map(FOODS.map((f, i) => [f.slug, { ...f, id: i + 1 }]));
const library: Candidate[] = RECIPES.map((r) => {
  const ingredients = r.ingredients.map(([slug, grams]) => {
    const f = foods.get(slug)!;
    return { foodItemId: f.id, name: f.name, terms: [f.name.toLowerCase(), f.fdc.toLowerCase(), ...(f.aliases ?? [])], category: f.category, grams, allergens: f.allergens ?? [], restrictions: f.restrictions ?? [], pattern: f.pattern };
  });
  return {
    id: r.slug, title: r.title, cuisine: r.cuisine, mealTypes: r.mealTypes, servings: r.servings, totalMinutes: r.prep + r.cook, costTier: r.costTier,
    kcal: 1, protein: 0, carbs: 0, fat: 0,
    pattern: ingredients.reduce((p, i) => (PATTERN_RANK[i.pattern] > PATTERN_RANK[p] ? i.pattern : p), "vegan" as Candidate["pattern"]),
    // Deliberately empty: the rules must catch allergens from ingredients alone.
    allergens: [], restrictions: [],
    ingredients,
  };
});

const base: PlannerPrefs = { pattern: "omnivore", allergies: [], restrictions: [], dislikes: [], likes: [], cuisines: [], maxCookMinutes: null, mealsPerDay: 4, includeSnacks: true, budgetConscious: false };

// Common profiles the launch library must support with enough variety.
const PROFILES: [string, Partial<PlannerPrefs>][] = [
  ["everything", {}],
  ["vegetarian", { pattern: "vegetarian" }],
  ["vegan", { pattern: "vegan" }],
  ["pescatarian", { pattern: "pescatarian" }],
  ["gluten-free", { allergies: ["gluten"] }],
  ["dairy-free", { allergies: ["dairy"] }],
  ["peanut and tree-nut allergy", { allergies: ["peanut", "tree_nut"] }],
  ["egg allergy", { allergies: ["egg"] }],
  ["no pork, no alcohol", { restrictions: ["pork", "alcohol"] }],
  ["vegetarian, gluten-free", { pattern: "vegetarian", allergies: ["gluten"] }],
  ["quick meals (30 min)", { maxCookMinutes: 30 }],
];

describe("curated library coverage", () => {
  for (const [name, over] of PROFILES) {
    it(`has enough recipes for: ${name}`, () => {
      const prefs = { ...base, ...over };
      const pools = buildPools(library, prefs, buildSlots(prefs.mealsPerDay, prefs.includeSnacks));
      const short = insufficientPools(pools).map((t) => `${t} (${pools.get(t)!.length}/${MIN_POOL[t]})`);
      expect(short, `not enough recipes for ${name}`).toEqual([]);
    });
  }

  it("never offers a recipe with an excluded allergen, whatever the recipe-level tags say", () => {
    const allergens = [...new Set(FOODS.flatMap((f) => f.allergens ?? []))];
    for (const a of allergens) {
      const pools = buildPools(library, { ...base, allergies: [a] }, buildSlots(4, true));
      for (const list of pools.values())
        for (const c of list) expect(c.ingredients.some((i) => i.allergens.includes(a)), `${c.id} contains ${a}`).toBe(false);
    }
  });

  it("never offers animal products to vegans or meat to pescatarians", () => {
    for (const pattern of ["vegan", "vegetarian", "pescatarian"] as const) {
      const pools = buildPools(library, { ...base, pattern }, buildSlots(4, true));
      for (const list of pools.values())
        for (const c of list) expect(c.ingredients.every((i) => PATTERN_RANK[i.pattern] <= PATTERN_RANK[pattern]), `${c.id} for ${pattern}`).toBe(true);
    }
  });
});
