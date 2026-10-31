import { FOODS, type CuratedFood } from "../../data/foods";
import { RECIPES, type CuratedRecipe } from "../../data/recipes";
import type { Allergen, DietaryPattern, MealType, Restriction } from "./planner/types";

const RANK: Record<DietaryPattern, number> = { vegan: 0, vegetarian: 1, pescatarian: 2, omnivore: 3 };
const FOOD = new Map(FOODS.map((f) => [f.slug, f]));

export interface LibraryRecipe extends CuratedRecipe {
  pattern: DietaryPattern;
  allergens: Allergen[];
  restrictions: Restriction[];
  foods: { food: CuratedFood; grams: number; qty?: number; unit?: string; note?: string }[];
  totalMinutes: number;
}

/** The curated recipe library with diet and allergen labels derived from ingredients (same rule as the database). */
export const LIBRARY: LibraryRecipe[] = RECIPES.map((r) => {
  const foods = r.ingredients.map(([slug, grams, qty, unit, note]) => ({ food: FOOD.get(slug)!, grams, qty, unit, note }));
  return {
    ...r,
    foods,
    pattern: foods.reduce<DietaryPattern>((p, { food }) => (RANK[food.pattern] > RANK[p] ? food.pattern : p), "vegan"),
    allergens: [...new Set(foods.flatMap(({ food }) => food.allergens ?? []))],
    restrictions: [...new Set(foods.flatMap(({ food }) => food.restrictions ?? []))],
    totalMinutes: r.prep + r.cook,
  };
});

export const BY_SLUG = new Map(LIBRARY.map((r) => [r.slug, r]));

export const PATTERN_LABEL: Record<DietaryPattern, string> = { vegan: "Vegan", vegetarian: "Vegetarian", pescatarian: "Pescatarian", omnivore: "Contains meat" };

export interface LibraryFilter {
  pattern?: DietaryPattern;
  avoid?: Allergen[];
  cuisines?: string[];
  maxCostTier?: number;
  maxMinutes?: number;
}

export function matches(r: LibraryRecipe, f: LibraryFilter): boolean {
  if (f.pattern && RANK[r.pattern] > RANK[f.pattern]) return false;
  if (f.avoid?.some((a) => r.allergens.includes(a))) return false;
  if (f.maxCostTier && r.costTier > f.maxCostTier) return false;
  if (f.maxMinutes && r.totalMinutes > f.maxMinutes) return false;
  return true;
}

const TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * A deterministic example week for a landing page. Featured recipes (and the
 * page's cuisines) are used when there are enough of them; otherwise the
 * pool is topped up with other recipes that fit the filter. No dish appears
 * twice in the same day.
 */
export function sampleWeek(filter: LibraryFilter, prefer: string[] = []): Record<MealType, LibraryRecipe>[] {
  const rank = (r: LibraryRecipe) => {
    const p = prefer.indexOf(r.slug);
    if (p !== -1) return p;
    if (filter.cuisines?.includes(r.cuisine)) return 1000;
    return 2000;
  };
  const pool = (t: MealType) => {
    const all = LIBRARY.filter((r) => r.mealTypes.includes(t) && matches(r, filter)).sort(
      (a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug),
    );
    const featured = all.filter((r) => rank(r) < 2000);
    return featured.length >= 2 ? featured.slice(0, 7) : all.slice(0, 7);
  };
  const pools = Object.fromEntries(TYPES.map((t) => [t, pool(t)])) as Record<MealType, LibraryRecipe[]>;
  const pick = (t: MealType, day: number, taken: Set<string>) => {
    const list = pools[t];
    for (let k = 0; k < list.length; k++) {
      const r = list[(day + k) % list.length];
      if (!taken.has(r.slug)) return r;
    }
    return list[day % list.length];
  };
  return Array.from({ length: 7 }, (_, day) => {
    const taken = new Set<string>();
    const meal = {} as Record<MealType, LibraryRecipe>;
    for (const t of TYPES) {
      meal[t] = pick(t, day, taken);
      taken.add(meal[t].slug);
    }
    return meal;
  });
}
