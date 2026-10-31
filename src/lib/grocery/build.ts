export interface RecipeForGrocery {
  servings: number;
  ingredients: { foodItemId: number; name: string; category: string; grams: number }[];
}

export interface GroceryLine {
  foodItemId: number;
  name: string;
  category: string;
  grams: number;
}

export const CATEGORY_ORDER = ["produce", "meat_fish", "dairy_eggs", "legumes_tofu", "grains_bakery", "nuts_seeds", "pantry", "spices_herbs", "other"];
export const CATEGORY_LABEL: Record<string, string> = {
  produce: "Fruit & vegetables",
  meat_fish: "Meat & fish",
  dairy_eggs: "Dairy, eggs & alternatives",
  legumes_tofu: "Beans, lentils & tofu",
  grains_bakery: "Grains & bakery",
  nuts_seeds: "Nuts & seeds",
  pantry: "Pantry",
  spices_herbs: "Herbs & spices",
  other: "Other",
};

/** Combine every ingredient across the planned meals, scaled to planned servings. */
export function buildGroceryLines(meals: { recipeId: string; servings: number }[], recipes: Map<string, RecipeForGrocery>): GroceryLine[] {
  const lines = new Map<number, GroceryLine>();
  for (const m of meals) {
    const r = recipes.get(m.recipeId);
    if (!r) continue;
    const factor = m.servings / r.servings;
    for (const i of r.ingredients) {
      const line = lines.get(i.foodItemId) ?? { foodItemId: i.foodItemId, name: i.name, category: i.category, grams: 0 };
      line.grams += i.grams * factor;
      lines.set(i.foodItemId, line);
    }
  }
  return [...lines.values()]
    .map((l) => ({ ...l, grams: Math.max(1, Math.round(l.grams)) }))
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name));
}

export function categoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

/** Human-friendly amount for a gram weight in the user's units. */
export function formatGrams(grams: number, units: "metric" | "imperial"): string {
  if (units === "imperial") {
    const oz = grams / 28.349523125;
    if (oz >= 16) return `${(oz / 16).toFixed(oz >= 160 ? 0 : 1)} lb`;
    return `${oz < 1 ? oz.toFixed(1) : Math.round(oz)} oz`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams >= 10000 ? 0 : 1)} kg`;
  return `${Math.round(grams)} g`;
}
