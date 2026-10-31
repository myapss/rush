import { describe, expect, it } from "vitest";
import { matchPantry, type CatalogFood } from "./catalog";
import { validateIdea, type Idea } from "./validate";

// Test catalog with made-up nutrition values (unit tests only).
const food = (id: number, name: string, extra: Partial<CatalogFood> = {}): CatalogFood => ({
  id, name, displayName: name, terms: [name.toLowerCase()], category: "produce", allergens: [], restrictions: [], pattern: "vegan",
  kcal: 100, protein: 5, carbs: 15, fat: 2, ...extra,
});
const rice = food(1, "Rice (cooked)", { terms: ["rice, white, cooked", "rice"], kcal: 130 });
const beans = food(2, "Black beans", { terms: ["beans, black", "black beans", "beans"] });
const peanut = food(3, "Peanut butter", { allergens: ["peanut"], kcal: 590 });
const chicken = food(4, "Chicken breast", { pattern: "omnivore", kcal: 120, protein: 22 });
const spinach = food(5, "Spinach", { kcal: 23 });
const codes = new Map([["F1", rice], ["F2", beans], ["F3", peanut], ["F4", chicken], ["F5", spinach]]);
const prefs = { pattern: "vegetarian" as const, allergies: ["peanut" as const], restrictions: [], dislikes: ["mushroom"] };

const idea = (over: Partial<Idea> = {}): Idea => ({
  title: "Bean and rice bowl",
  description: "Simple and filling.",
  meal_type: "lunch",
  servings: 2,
  prep_minutes: 10,
  cook_minutes: 15,
  ingredients: [
    { food: "F1", grams: 300, amount: "2 cups", note: "" },
    { food: "F2", grams: 250, amount: "1.5 cups", note: "rinsed" },
    { food: "F5", grams: 100, amount: "3 cups", note: "" },
  ],
  steps: ["Warm the beans.", "Wilt the spinach.", "Serve over rice."],
  substitutions: [{ instead_of: "F5", use: "F2", tip: "More beans for extra protein." }],
  ...over,
});

describe("validateIdea", () => {
  it("accepts a valid idea and computes nutrition from food data, not the model", () => {
    const r = validateIdea(idea(), codes, prefs, { maxMinutes: 30, mealType: "lunch" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // (300×130 + 250×100 + 100×23) / 100 / 2 servings = 331.5 → 332
    expect(r.recipe.perServing.kcal).toBe(332);
    expect(r.recipe.ingredients[1].note).toBe("1.5 cups, rinsed");
    expect(r.recipe.substitutions).toHaveLength(1);
  });

  it("rejects allergens, wrong eating style and unknown codes", () => {
    const bad = validateIdea(idea({ ingredients: [...idea().ingredients, { food: "F3", grams: 30, amount: "2 tbsp", note: "" }, { food: "F4", grams: 150, amount: "", note: "" }, { food: "X9", grams: 10, amount: "", note: "" }] }), codes, prefs, { maxMinutes: null, mealType: null });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.problems.join(" | ")).toMatch(/Peanut butter isn't allowed \(allergy\)/);
    expect(bad.problems.join(" | ")).toMatch(/Chicken breast isn't allowed \(eating_style\)/);
    expect(bad.problems.join(" | ")).toMatch(/unknown ingredient code X9/);
  });

  it("enforces time limits, meal type and sensible portions", () => {
    expect(validateIdea(idea({ cook_minutes: 60 }), codes, prefs, { maxMinutes: 30, mealType: null }).ok).toBe(false);
    expect(validateIdea(idea({ meal_type: "dinner" }), codes, prefs, { maxMinutes: null, mealType: "lunch" }).ok).toBe(false);
    const tiny = idea({ ingredients: [{ food: "F5", grams: 20, amount: "", note: "" }, { food: "F1", grams: 10, amount: "", note: "" }] });
    expect(validateIdea(tiny, codes, prefs, { maxMinutes: null, mealType: null }).ok).toBe(false);
  });

  it("drops substitutions that would introduce an excluded food", () => {
    const r = validateIdea(idea({ substitutions: [{ instead_of: "F2", use: "F3", tip: "Use peanut butter" }] }), codes, prefs, { maxMinutes: null, mealType: null });
    expect(r.ok && r.recipe.substitutions).toEqual([]);
  });

  it("merges duplicate ingredients and trims text", () => {
    const r = validateIdea(idea({ title: "  Bowl   ", ingredients: [...idea().ingredients, { food: "F1", grams: 100, amount: "", note: "" }] }), codes, prefs, { maxMinutes: null, mealType: null });
    expect(r.ok && r.recipe.ingredients.find((i) => i.food.id === 1)?.grams).toBe(400);
    expect(r.ok && r.recipe.title).toBe("Bowl");
  });
});

describe("matchPantry", () => {
  it("matches what the user has, flags excluded foods and unknown items", () => {
    const { matches, unknown } = matchPantry(["rice", "peanut butter", "chicken", "dragonfruit"], [rice, beans, peanut, chicken, spinach], prefs);
    expect(matches.find((m) => m.input === "rice")?.allowed.map((f) => f.id)).toEqual([1]);
    expect(matches.find((m) => m.input === "peanut butter")?.excluded[0].reason).toBe("allergy");
    expect(matches.find((m) => m.input === "chicken")?.excluded[0].reason).toBe("eating_style");
    expect(unknown).toEqual(["dragonfruit"]);
  });
});
