import type { Preferences, Profile } from "@/lib/data/profile";
import { computeTargets } from "@/lib/nutrition/targets";
import type { HealthFlags } from "@/lib/nutrition/types";
import type { PlannerPrefs, PlanTargets } from "./types";

export function plannerPrefs(prefs: Preferences): PlannerPrefs {
  return {
    pattern: prefs.dietary_pattern,
    allergies: prefs.allergies,
    restrictions: prefs.food_restrictions,
    dislikes: prefs.disliked_foods,
    likes: prefs.liked_foods,
    cuisines: prefs.preferred_cuisines,
    maxCookMinutes: prefs.max_cook_minutes,
    mealsPerDay: prefs.meals_per_day,
    includeSnacks: prefs.include_snacks,
    budgetConscious: prefs.budget_amount !== null,
  };
}

export type TargetsOutcome =
  | { ok: true; targets: PlanTargets; snapshot: Record<string, unknown> }
  | { ok: false; reason: "no_body_data" | "not_applicable"; message: string };

/** Calorie/protein targets for planning, with the same safety rules as everywhere else. */
export function planTargets(profile: Profile, prefs: Preferences, currentYear: number): TargetsOutcome {
  if (!profile.birth_year || !profile.height_cm || !profile.weight_kg || !profile.sex_for_calc) {
    return {
      ok: false,
      reason: "no_body_data",
      message: "Add your height and weight (with consent) in Settings so we can size your portions.",
    };
  }
  const r = computeTargets({
    age: currentYear - profile.birth_year,
    sex: profile.sex_for_calc,
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    activity: prefs.activity_level,
    goal: prefs.goal,
    flags: profile.health_flags as HealthFlags,
  });
  if (r.status !== "ok") {
    return {
      ok: false,
      reason: "not_applicable",
      message:
        "We can't create calorie-based meal plans for your situation. A doctor or registered dietitian can help you plan meals safely.",
    };
  }
  return {
    ok: true,
    targets: { kcal: r.calories.target, proteinMin: r.protein.range.min },
    snapshot: { kcal: r.calories.target, kcal_range: r.calories.range, protein_g: r.protein.grams, carbs_g: r.carbs.grams, fat_g: r.fat.grams, goal: r.appliedGoal },
  };
}
