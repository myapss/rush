import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { PATTERN_RANK } from "./rules";
import type { Candidate, PlannerPrefs } from "./types";

type Client = SupabaseClient<Database>;

const RECIPE_SELECT = `id, title, cuisine, meal_types, servings, prep_minutes, cook_minutes, cost_tier, dietary_pattern,
  allergen_tags, restriction_tags, nutrition_per_serving,
  recipe_ingredients(grams, food_items(id, name, display_name, aliases, category, allergens, restrictions, dietary_pattern))`;

type Row = {
  id: string;
  title: string;
  cuisine: string | null;
  meal_types: Candidate["mealTypes"];
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  cost_tier: number | null;
  dietary_pattern: Candidate["pattern"];
  allergen_tags: Candidate["allergens"];
  restriction_tags: Candidate["restrictions"];
  nutrition_per_serving: unknown;
  recipe_ingredients: {
    grams: number;
    food_items: {
      id: number;
      name: string;
      display_name: string | null;
      aliases: string[];
      category: string;
      allergens: Candidate["allergens"];
      restrictions: Candidate["restrictions"];
      dietary_pattern: Candidate["pattern"];
    } | null;
  }[];
};

export function toCandidate(r: Row): Candidate {
  const n = (r.nutrition_per_serving ?? {}) as Record<string, number>;
  return {
    id: r.id,
    title: r.title,
    cuisine: r.cuisine,
    mealTypes: r.meal_types,
    servings: r.servings,
    totalMinutes: r.prep_minutes + r.cook_minutes,
    costTier: r.cost_tier,
    kcal: Number(n.kcal ?? 0),
    protein: Number(n.protein_g ?? 0),
    carbs: Number(n.carbs_g ?? 0),
    fat: Number(n.fat_g ?? 0),
    pattern: r.dietary_pattern,
    allergens: r.allergen_tags,
    restrictions: r.restriction_tags,
    ingredients: r.recipe_ingredients.flatMap((ri) =>
      ri.food_items
        ? [
            {
              foodItemId: ri.food_items.id,
              name: ri.food_items.display_name ?? ri.food_items.name,
              terms: [ri.food_items.name, ri.food_items.display_name ?? "", ...ri.food_items.aliases].filter(Boolean).map((t) => t.toLowerCase()),
              category: ri.food_items.category,
              grams: Number(ri.grams),
              allergens: ri.food_items.allergens,
              restrictions: ri.food_items.restrictions,
              pattern: ri.food_items.dietary_pattern,
            },
          ]
        : [],
    ),
  };
}

/**
 * Public recipes that can possibly suit the user. The SQL filter is a
 * first pass; rules.ts re-checks every ingredient in code.
 */
export async function loadCandidates(supabase: Client, prefs: PlannerPrefs): Promise<Candidate[]> {
  const patterns = (Object.keys(PATTERN_RANK) as Candidate["pattern"][]).filter((p) => PATTERN_RANK[p] <= PATTERN_RANK[prefs.pattern]);
  let q = supabase.from("recipes").select(RECIPE_SELECT).eq("visibility", "public").in("dietary_pattern", patterns);
  if (prefs.allergies.length) q = q.not("allergen_tags", "ov", `{${prefs.allergies.join(",")}}`);
  if (prefs.restrictions.length) q = q.not("restriction_tags", "ov", `{${prefs.restrictions.join(",")}}`);
  const { data, error } = await q;
  if (error) throw new Error(`Could not load recipes: ${error.message}`);
  return (data as unknown as Row[]).map(toCandidate);
}

/** Load specific recipes by id (e.g. those in a saved plan). */
export async function loadRecipesById(supabase: Client, ids: string[]): Promise<Map<string, Candidate>> {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("recipes").select(RECIPE_SELECT).in("id", ids);
  if (error) throw new Error(`Could not load recipes: ${error.message}`);
  return new Map((data as unknown as Row[]).map((r) => [r.id, toCandidate(r)]));
}
