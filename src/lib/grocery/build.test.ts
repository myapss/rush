import { describe, expect, it } from "vitest";
import { buildGroceryLines, formatGrams } from "./build";

const recipes = new Map([
  ["a", { servings: 2, ingredients: [{ foodItemId: 1, name: "Onions", category: "produce", grams: 100 }, { foodItemId: 2, name: "Rice", category: "grains_bakery", grams: 300 }] }],
  ["b", { servings: 1, ingredients: [{ foodItemId: 1, name: "Onions", category: "produce", grams: 50 }, { foodItemId: 3, name: "Eggs", category: "dairy_eggs", grams: 100 }] }],
]);

describe("grocery list", () => {
  it("combines duplicates and scales by planned servings", () => {
    const lines = buildGroceryLines([{ recipeId: "a", servings: 1 }, { recipeId: "a", servings: 2 }, { recipeId: "b", servings: 1.5 }], recipes);
    // onions: 100*(1/2) + 100*(2/2) + 50*1.5 = 225
    expect(lines.find((l) => l.foodItemId === 1)?.grams).toBe(225);
    expect(lines.find((l) => l.foodItemId === 2)?.grams).toBe(450);
    expect(lines.map((l) => l.category)).toEqual(["produce", "dairy_eggs", "grains_bakery"]);
  });

  it("formats amounts in metric and imperial", () => {
    expect(formatGrams(450, "metric")).toBe("450 g");
    expect(formatGrams(1250, "metric")).toBe("1.3 kg");
    expect(formatGrams(225, "imperial")).toBe("8 oz");
    expect(formatGrams(907, "imperial")).toBe("2.0 lb");
    expect(formatGrams(10, "imperial")).toBe("0.4 oz");
  });
});
