import { matchesDislike, PATTERN_RANK } from "@/lib/planner/rules";
import type { Allergen, Candidate, DietaryPattern, PlannerPrefs, Restriction } from "@/lib/planner/types";

export interface CatalogFood {
  id: number;
  name: string;
  displayName: string;
  terms: string[];
  category: string;
  allergens: Allergen[];
  restrictions: Restriction[];
  pattern: DietaryPattern;
  /** Per 100 g, from USDA data. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type ExcludeReason = "allergy" | "eating_style" | "restriction" | "dislike";

/** Why a food can't be used for this user, or null if it can. */
export function excludeReason(f: CatalogFood, prefs: Pick<PlannerPrefs, "pattern" | "allergies" | "restrictions" | "dislikes">): ExcludeReason | null {
  if (f.allergens.some((a) => prefs.allergies.includes(a))) return "allergy";
  if (PATTERN_RANK[f.pattern] > PATTERN_RANK[prefs.pattern]) return "eating_style";
  if (f.restrictions.some((r) => prefs.restrictions.includes(r))) return "restriction";
  const asCandidate = { title: f.displayName, ingredients: [{ terms: f.terms }] } as unknown as Candidate;
  if (matchesDislike(asCandidate, prefs.dislikes)) return "dislike";
  return null;
}

export interface PantryMatch {
  input: string;
  allowed: CatalogFood[];
  excluded: { food: CatalogFood; reason: ExcludeReason }[];
}

const norm = (s: string) => s.trim().toLowerCase();

/** Match what the user says they have to foods in our database. */
export function matchPantry(have: string[], foods: CatalogFood[], prefs: Parameters<typeof excludeReason>[1]) {
  const matches: PantryMatch[] = [];
  const unknown: string[] = [];
  for (const raw of have) {
    const q = norm(raw);
    if (q.length < 2) continue;
    // Prefer whole-word matches ("rice" shouldn't match "licorice").
    const re = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    const hits = foods.filter((f) => f.terms.some((t) => re.test(t)));
    if (!hits.length) {
      unknown.push(raw.trim());
      continue;
    }
    const m: PantryMatch = { input: raw.trim(), allowed: [], excluded: [] };
    for (const f of hits) {
      const reason = excludeReason(f, prefs);
      if (reason) m.excluded.push({ food: f, reason });
      else m.allowed.push(f);
    }
    matches.push(m);
  }
  return { matches, unknown };
}
