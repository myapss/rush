import type { Candidate, DietaryPattern, MealType, PlannerPrefs } from "./types";

export const PATTERN_RANK: Record<DietaryPattern, number> = { vegan: 0, vegetarian: 1, pescatarian: 2, omnivore: 3 };

export type RejectReason = "pattern" | "allergen" | "restriction" | "dislike" | "time" | "no_nutrition" | "meal_type";

const normalize = (s: string) => s.trim().toLowerCase();

/** Does any ingredient match a disliked food (by name or alias, whole word)? */
export function matchesDislike(c: Candidate, dislikes: string[]): string | null {
  for (const raw of dislikes) {
    const d = normalize(raw);
    if (!d) continue;
    const re = new RegExp(`\\b${d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (c.ingredients.some((i) => i.terms.some((t) => re.test(t))) || re.test(c.title)) return raw;
  }
  return null;
}

/**
 * Hard safety and preference rules. Checks both the recipe-level tags and
 * every ingredient, so a stale or wrong recipe tag can't let an allergen
 * through.
 */
export function rejectReason(c: Candidate, prefs: PlannerPrefs, mealType?: MealType): RejectReason | null {
  if (mealType && !c.mealTypes.includes(mealType)) return "meal_type";
  if (!(c.kcal > 0) || c.ingredients.length === 0) return "no_nutrition";

  const maxRank = PATTERN_RANK[prefs.pattern];
  if (PATTERN_RANK[c.pattern] > maxRank || c.ingredients.some((i) => PATTERN_RANK[i.pattern] > maxRank)) return "pattern";

  const allergies = new Set(prefs.allergies);
  if (c.allergens.some((a) => allergies.has(a)) || c.ingredients.some((i) => i.allergens.some((a) => allergies.has(a))))
    return "allergen";

  const restrictions = new Set(prefs.restrictions);
  if (c.restrictions.some((r) => restrictions.has(r)) || c.ingredients.some((i) => i.restrictions.some((r) => restrictions.has(r))))
    return "restriction";

  if (matchesDislike(c, prefs.dislikes)) return "dislike";
  if (prefs.maxCookMinutes !== null && c.totalMinutes > prefs.maxCookMinutes) return "time";
  return null;
}

export function isAllowed(c: Candidate, prefs: PlannerPrefs, mealType?: MealType): boolean {
  return rejectReason(c, prefs, mealType) === null;
}
