import { describe, expect, it } from "vitest";
import { dayNutrition } from "./nutrition";
import { buildPools, insufficientPools, rulesPlan, seededRandom, validatePlan, withServings } from "./plan";
import { matchesDislike, rejectReason } from "./rules";
import { buildSlots, servingsFor, slotTargets } from "./slots";
import type { Allergen, Candidate, CandidateIngredient, DietaryPattern, MealType, PlannerPrefs } from "./types";

// Synthetic test recipes (made-up nutrition, for unit tests only).
let nextId = 0;
function ing(name: string, extra: Partial<CandidateIngredient> = {}): CandidateIngredient {
  return { foodItemId: ++nextId, name, terms: [name.toLowerCase()], category: "produce", grams: 100, allergens: [], restrictions: [], pattern: "vegan", ...extra };
}
function recipe(title: string, mealTypes: MealType[], kcal: number, extra: Partial<Candidate> = {}): Candidate {
  const ingredients = extra.ingredients ?? [ing(title)];
  return {
    id: `r-${++nextId}`,
    title,
    cuisine: "International",
    mealTypes,
    servings: 1,
    totalMinutes: 20,
    costTier: 1,
    kcal,
    protein: kcal / 20,
    carbs: kcal / 8,
    fat: kcal / 30,
    pattern: ingredients.reduce<DietaryPattern>((p, i) => (["vegan", "vegetarian", "pescatarian", "omnivore"].indexOf(i.pattern) > ["vegan", "vegetarian", "pescatarian", "omnivore"].indexOf(p) ? i.pattern : p), "vegan"),
    allergens: [...new Set(ingredients.flatMap((i) => i.allergens))],
    restrictions: [...new Set(ingredients.flatMap((i) => i.restrictions))],
    ingredients,
    ...extra,
  };
}

const prefs = (over: Partial<PlannerPrefs> = {}): PlannerPrefs => ({
  pattern: "omnivore",
  allergies: [],
  restrictions: [],
  dislikes: [],
  likes: [],
  cuisines: [],
  maxCookMinutes: null,
  mealsPerDay: 4,
  includeSnacks: true,
  budgetConscious: false,
  ...over,
});

const ALL_ALLERGENS: Allergen[] = ["gluten", "dairy", "egg", "peanut", "tree_nut", "soy", "fish", "shellfish", "sesame"];

function library(): Candidate[] {
  const list: Candidate[] = [];
  const types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const kcal = { breakfast: 400, lunch: 550, dinner: 600, snack: 180 };
  types.forEach((t) => {
    for (let i = 0; i < 8; i++) {
      const allergen = ALL_ALLERGENS[(i + t.length) % ALL_ALLERGENS.length];
      const pattern: DietaryPattern = (["vegan", "vegetarian", "pescatarian", "omnivore"] as const)[i % 4];
      list.push(recipe(`${t} ${i}`, [t], kcal[t] + i * 10, { ingredients: [ing(`${t} base ${i}`), ing(`${t} extra ${i}`, { allergens: i % 3 === 0 ? [] : [allergen], pattern })] }));
    }
  });
  return list;
}

describe("slots and servings", () => {
  it("lays out meals per day", () => {
    expect(buildSlots(3, true)).toEqual(["breakfast", "lunch", "dinner"]);
    expect(buildSlots(5, true)).toEqual(["breakfast", "snack", "lunch", "snack", "dinner"]);
    expect(buildSlots(5, false)).toEqual(["breakfast", "lunch", "dinner"]);
  });

  it("splits calories by meal size and sums to the target", () => {
    const t = slotTargets(2000, buildSlots(4, true));
    expect(t.reduce((a, b) => a + b, 0)).toBeCloseTo(2000);
    expect(t[3]).toBeGreaterThan(t[2]); // dinner > snack
  });

  it("rounds servings to quarters within bounds", () => {
    expect(servingsFor(400, 500)).toBe(1.25);
    expect(servingsFor(100, 2000)).toBe(3);
    expect(servingsFor(1000, 100)).toBe(0.5);
  });
});

describe("rules", () => {
  it("rejects allergens found only at ingredient level, even if recipe tags are wrong", () => {
    const sneaky = recipe("Satay", ["dinner"], 500, { ingredients: [ing("peanut sauce", { allergens: ["peanut"] })], allergens: [] });
    expect(rejectReason(sneaky, prefs({ allergies: ["peanut"] }))).toBe("allergen");
  });

  it("enforces eating pattern at ingredient level", () => {
    const fishy = recipe("Soup", ["lunch"], 400, { ingredients: [ing("fish stock", { pattern: "pescatarian" })], pattern: "vegan" });
    expect(rejectReason(fishy, prefs({ pattern: "vegetarian" }))).toBe("pattern");
    expect(rejectReason(fishy, prefs({ pattern: "pescatarian" }))).toBeNull();
  });

  it("matches dislikes on whole words in names and aliases", () => {
    const r = recipe("Mushroom pasta", ["dinner"], 500, { ingredients: [ing("Mushrooms, white, raw", { terms: ["mushrooms, white, raw", "mushrooms"] })] });
    expect(matchesDislike(r, ["mushroom"])).toBe("mushroom");
    expect(matchesDislike(r, ["rice"])).toBeNull();
    expect(matchesDislike(r, ["(bad regex"])).toBeNull();
  });

  it("applies restrictions and cooking time", () => {
    const pork = recipe("Pork", ["dinner"], 500, { ingredients: [ing("pork", { restrictions: ["pork"], pattern: "omnivore" })] });
    expect(rejectReason(pork, prefs({ restrictions: ["pork"] }))).toBe("restriction");
    expect(rejectReason(recipe("Slow", ["dinner"], 500, { totalMinutes: 90 }), prefs({ maxCookMinutes: 30 }))).toBe("time");
  });
});

describe("rules planner", () => {
  const targets = { kcal: 2000, proteinMin: 60 };

  it("builds a valid 7-day plan near the calorie target", () => {
    const p = prefs();
    const slots = buildSlots(p.mealsPerDay, p.includeSnacks);
    const lib = library();
    const pools = buildPools(lib, p, slots);
    const plan = rulesPlan(pools, p, slots, targets, 42);
    const byId = new Map(lib.map((c) => [c.id, c]));
    const v = validatePlan(plan, slots, byId, p, targets, pools);
    expect(v.hard).toEqual([]);
    expect(v.soft).toEqual([]);
    for (const day of plan.days) expect(Math.abs(dayNutrition(day, byId).kcal - 2000)).toBeLessThanOrEqual(200);
  });

  it("never includes an excluded allergen or pattern across many random profiles", () => {
    const lib = library();
    const byId = new Map(lib.map((c) => [c.id, c]));
    const rand = seededRandom(7);
    for (let i = 0; i < 200; i++) {
      const allergies = ALL_ALLERGENS.filter(() => rand() < 0.2);
      const pattern = (["vegan", "vegetarian", "pescatarian", "omnivore"] as const)[Math.floor(rand() * 4)];
      const p = prefs({ allergies, pattern, mealsPerDay: 2 + Math.floor(rand() * 5) });
      const slots = buildSlots(p.mealsPerDay, p.includeSnacks);
      const pools = buildPools(lib, p, slots);
      if (insufficientPools(pools).length) continue;
      const plan = rulesPlan(pools, p, slots, targets, i);
      expect(validatePlan(plan, slots, byId, p, targets, pools).hard).toEqual([]);
      for (const m of plan.days.flat()) {
        const c = byId.get(m.recipeId)!;
        expect(c.ingredients.flatMap((x) => x.allergens).some((a) => allergies.includes(a))).toBe(false);
      }
    }
  });

  it("reports when restrictions leave too few recipes", () => {
    const p = prefs({ allergies: ALL_ALLERGENS, pattern: "vegan" });
    const pools = buildPools(library(), p, buildSlots(3, true));
    expect(insufficientPools(pools).length).toBeGreaterThan(0);
  });

  it("prefers the user's cuisines", () => {
    const lib = library().map((c, i) => ({ ...c, cuisine: i % 2 ? "Nigerian" : "Other" }));
    const p = prefs({ cuisines: ["Nigerian"] });
    const slots = buildSlots(3, false);
    const plan = rulesPlan(buildPools(lib, p, slots), p, slots, targets, 1);
    const byId = new Map(lib.map((c) => [c.id, c]));
    const share = plan.days.flat().filter((m) => byId.get(m.recipeId)!.cuisine === "Nigerian").length / plan.days.flat().length;
    expect(share).toBeGreaterThan(0.6);
  });
});

describe("validation", () => {
  const p = prefs({ allergies: ["peanut"] });
  const slots = buildSlots(3, true);
  const lib = [
    ...["breakfast", "lunch", "dinner"].flatMap((t) => [recipe(`${t} a`, [t as MealType], 600), recipe(`${t} b`, [t as MealType], 650)]),
  ];
  const peanut = recipe("Peanut stew", ["dinner"], 650, { ingredients: [ing("peanuts", { allergens: ["peanut"] })] });
  const byId = new Map([...lib, peanut].map((c) => [c.id, c]));
  const pools = buildPools(lib, p, slots);
  const targets = { kcal: 1900, proteinMin: 50 };
  const pick = (t: MealType, n: number) => lib.filter((c) => c.mealTypes.includes(t))[n % 2].id;

  it("flags a disallowed recipe as a hard error even if the AI picked it", () => {
    const days = Array.from({ length: 7 }, (_, d) => slots.map((t) => ({ mealType: t, recipeId: t === "dinner" && d === 3 ? peanut.id : pick(t, d) })));
    const v = validatePlan(withServings(days, slots, byId, targets), slots, byId, p, targets, pools);
    expect(v.hard.some((h) => h.includes("Peanut stew") && h.includes("allergen"))).toBe(true);
  });

  it("flags unknown recipes and wrong structure", () => {
    const days = Array.from({ length: 6 }, () => slots.map((t) => ({ mealType: t, recipeId: "nope" })));
    const v = validatePlan({ days: days.map((d) => d.map((m, slot) => ({ ...m, slot, servings: 1 }))) }, slots, byId, p, targets, pools);
    expect(v.hard.some((h) => h.includes("Expected 7 days"))).toBe(true);
    expect(v.hard.some((h) => h.includes("unknown recipe"))).toBe(true);
  });

  it("flags calorie targets that are badly missed as soft errors", () => {
    const days = Array.from({ length: 7 }, (_, d) => slots.map((t, slot) => ({ slot, mealType: t, recipeId: pick(t, d), servings: 0.5 })));
    const v = validatePlan({ days }, slots, byId, p, targets, pools);
    expect(v.hard).toEqual([]);
    expect(v.soft.some((s) => s.includes("kcal"))).toBe(true);
  });
});
