import type { ProfileDefaults } from "@/components/profile-form";
import type { Preferences, Profile } from "./profile";

export function toProfileDefaults(profile: Profile, prefs: Preferences | null): ProfileDefaults {
  const flags = (profile.health_flags ?? {}) as ProfileDefaults["flags"];
  return {
    displayName: profile.display_name ?? "",
    country: profile.country ?? "",
    currency: profile.currency ?? "USD",
    units: profile.measurement_unit,
    birthYear: profile.birth_year ? String(profile.birth_year) : "",
    sex: profile.sex_for_calc ?? "female",
    heightCm: profile.height_cm,
    weightKg: profile.weight_kg,
    healthConsent: profile.health_data_consent_at !== null,
    flags,
    goal: prefs?.goal ?? "healthier",
    activity: prefs?.activity_level ?? "light",
    dietaryPattern: prefs?.dietary_pattern ?? "omnivore",
    allergies: prefs?.allergies ?? [],
    restrictions: prefs?.food_restrictions ?? [],
    cuisines: prefs?.preferred_cuisines ?? [],
    likedFoods: prefs?.liked_foods ?? [],
    dislikedFoods: prefs?.disliked_foods ?? [],
    mealsPerDay: prefs?.meals_per_day ?? 3,
    includeSnacks: prefs?.include_snacks ?? true,
    maxCookMinutes: prefs?.max_cook_minutes ?? null,
    cookingSkill: prefs?.cooking_skill ?? "easy",
    budgetAmount: prefs?.budget_amount ?? null,
    budgetPeriod: prefs?.budget_period ?? "week",
  };
}
