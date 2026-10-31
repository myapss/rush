import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface MealRow {
  id: string;
  date: string;
  slot: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  recipe_id: string | null;
  recipe_title: string;
  servings: number;
  nutrition_snapshot: { kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number };
}

export async function getPlan(userId: string, planId?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("meal_plans")
    .select("id, title, start_date, end_date, status, generator, target_kcal, targets_snapshot, created_at, planned_meals(id, date, slot, meal_type, recipe_id, recipe_title, servings, nutrition_snapshot)")
    .eq("user_id", userId);
  q = planId ? q.eq("id", planId) : q.eq("status", "active");
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`Could not load plan: ${error.message}`);
  if (!data) return null;
  const meals = (data.planned_meals as unknown as MealRow[]).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  const days = new Map<string, MealRow[]>();
  for (const m of meals) days.set(m.date, [...(days.get(m.date) ?? []), m]);
  return { ...data, days };
}

export async function listRecentPlans(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_plans")
    .select("id, title, start_date, status, generator")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export function sumNutrition(meals: MealRow[]) {
  return meals.reduce(
    (a, m) => ({
      kcal: a.kcal + (m.nutrition_snapshot.kcal ?? 0),
      protein: a.protein + (m.nutrition_snapshot.protein_g ?? 0),
      carbs: a.carbs + (m.nutrition_snapshot.carbs_g ?? 0),
      fat: a.fat + (m.nutrition_snapshot.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
