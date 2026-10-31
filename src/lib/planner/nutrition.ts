import type { Candidate, Nutrition, PlannedMealDraft } from "./types";

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function mealNutrition(c: Candidate, servings: number): Nutrition {
  return { kcal: Math.round(c.kcal * servings), protein: round1(c.protein * servings), carbs: round1(c.carbs * servings), fat: round1(c.fat * servings) };
}

export function dayNutrition(meals: PlannedMealDraft[], byId: Map<string, Candidate>): Nutrition {
  return meals.reduce<Nutrition>(
    (acc, m) => {
      const c = byId.get(m.recipeId);
      if (!c) return acc;
      const n = mealNutrition(c, m.servings);
      return { kcal: acc.kcal + n.kcal, protein: round1(acc.protein + n.protein), carbs: round1(acc.carbs + n.carbs), fat: round1(acc.fat + n.fat) };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
