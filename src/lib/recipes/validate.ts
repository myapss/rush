import { z } from "zod";
import type { MealType, PlannerPrefs } from "@/lib/planner/types";
import { excludeReason, type CatalogFood } from "./catalog";

/** What the model returns (constraints are enforced below, not in the schema). */
export const ideaSchema = z.object({
  title: z.string(),
  description: z.string(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  servings: z.number(),
  prep_minutes: z.number(),
  cook_minutes: z.number(),
  ingredients: z.array(z.object({ food: z.string(), grams: z.number(), amount: z.string(), note: z.string() })),
  steps: z.array(z.string()),
  substitutions: z.array(z.object({ instead_of: z.string(), use: z.string(), tip: z.string() })),
});
export const recipeResponseSchema = z.object({ recipes: z.array(ideaSchema) });
export type Idea = z.infer<typeof ideaSchema>;

export interface ValidRecipe {
  title: string;
  description: string;
  mealType: MealType;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: { food: CatalogFood; grams: number; note: string | null }[];
  steps: string[];
  substitutions: { insteadOf: CatalogFood; use: CatalogFood; tip: string }[];
  perServing: { kcal: number; protein: number; carbs: number; fat: number };
}

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Check a model-proposed recipe against the allowed food catalog and the
 * user's rules. Model output is untrusted: anything unexpected rejects the idea.
 */
export function validateIdea(
  idea: Idea,
  codeToFood: Map<string, CatalogFood>,
  prefs: Pick<PlannerPrefs, "pattern" | "allergies" | "restrictions" | "dislikes">,
  limits: { maxMinutes: number | null; mealType: MealType | null },
): { ok: true; recipe: ValidRecipe } | { ok: false; problems: string[] } {
  const problems: string[] = [];
  const title = clean(idea.title, 120);
  if (title.length < 3) problems.push("missing title");
  if (limits.mealType && idea.meal_type !== limits.mealType) problems.push(`meal type ${idea.meal_type} doesn't match ${limits.mealType}`);

  const servings = Math.round(idea.servings);
  if (!(servings >= 1 && servings <= 8)) problems.push("servings must be 1–8");
  const prep = Math.round(idea.prep_minutes);
  const cook = Math.round(idea.cook_minutes);
  if (!(prep >= 0 && prep <= 240 && cook >= 0 && cook <= 480)) problems.push("unrealistic times");
  if (limits.maxMinutes && prep + cook > limits.maxMinutes) problems.push(`takes ${prep + cook} min, over the ${limits.maxMinutes} min limit`);

  // Merge duplicate foods; every ingredient must be an allowed catalog food.
  const byFood = new Map<number, { food: CatalogFood; grams: number; note: string | null }>();
  for (const ing of idea.ingredients) {
    const food = codeToFood.get(ing.food.trim());
    if (!food) {
      problems.push(`unknown ingredient code ${ing.food}`);
      continue;
    }
    const reason = excludeReason(food, prefs);
    if (reason) problems.push(`${food.displayName} isn't allowed (${reason})`);
    if (!(ing.grams > 0 && ing.grams <= 1500)) problems.push(`unrealistic amount of ${food.displayName}`);
    const note = clean([ing.amount, ing.note].filter((x) => x && x.trim()).join(", "), 200) || null;
    const prev = byFood.get(food.id);
    byFood.set(food.id, { food, grams: Math.round(((prev?.grams ?? 0) + ing.grams) * 10) / 10, note: prev?.note ?? note });
  }
  const ingredients = [...byFood.values()];
  if (ingredients.length < 2 || ingredients.length > 20) problems.push("needs 2–20 ingredients");

  const steps = idea.steps.map((s) => clean(s, 500)).filter((s) => s.length >= 3);
  if (steps.length < 1 || steps.length > 15) problems.push("needs 1–15 steps");

  const substitutions = idea.substitutions.flatMap((s) => {
    const insteadOf = codeToFood.get(s.instead_of.trim());
    const use = codeToFood.get(s.use.trim());
    if (!insteadOf || !use || insteadOf.id === use.id || excludeReason(use, prefs)) return [];
    return [{ insteadOf, use, tip: clean(s.tip, 200) }];
  }).slice(0, 5);

  const total = ingredients.reduce(
    (a, { food, grams }) => ({ kcal: a.kcal + (food.kcal * grams) / 100, protein: a.protein + (food.protein * grams) / 100, carbs: a.carbs + (food.carbs * grams) / 100, fat: a.fat + (food.fat * grams) / 100 }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const perServing = {
    kcal: Math.round(total.kcal / Math.max(servings, 1)),
    protein: Math.round((total.protein / Math.max(servings, 1)) * 10) / 10,
    carbs: Math.round((total.carbs / Math.max(servings, 1)) * 10) / 10,
    fat: Math.round((total.fat / Math.max(servings, 1)) * 10) / 10,
  };
  const [min, max] = idea.meal_type === "snack" ? [40, 600] : [150, 1500];
  if (perServing.kcal < min || perServing.kcal > max) problems.push(`${perServing.kcal} kcal per serving is outside a sensible range`);

  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    recipe: { title, description: clean(idea.description, 400), mealType: idea.meal_type, servings, prepMinutes: prep, cookMinutes: cook, ingredients, steps, substitutions, perServing },
  };
}
