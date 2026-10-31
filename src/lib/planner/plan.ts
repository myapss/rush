import { dayNutrition } from "./nutrition";
import { isAllowed, rejectReason } from "./rules";
import { MAX_SERVINGS, MIN_SERVINGS, servingsFor, slotTargets } from "./slots";
import type { Candidate, MealType, PlanDraft, PlannedMealDraft, PlannerPrefs, PlanTargets } from "./types";

export const DAYS = 7;
export const KCAL_TOLERANCE = 0.1;
/** Minimum distinct recipes per meal type to build a varied week. */
export const MIN_POOL: Record<MealType, number> = { breakfast: 2, lunch: 2, dinner: 2, snack: 1 };

export type Pools = Map<MealType, Candidate[]>;

export function buildPools(candidates: Candidate[], prefs: PlannerPrefs, slots: MealType[]): Pools {
  const pools: Pools = new Map();
  for (const type of new Set(slots)) pools.set(type, candidates.filter((c) => isAllowed(c, prefs, type)));
  return pools;
}

/** Meal types without enough allowed recipes. */
export function insufficientPools(pools: Pools): MealType[] {
  return [...pools].filter(([type, list]) => list.length < MIN_POOL[type]).map(([type]) => type);
}

/** How many times one recipe may appear in a week for a meal type. */
export function repeatCap(type: MealType, slots: MealType[], pools: Pools): number {
  const perWeek = DAYS * slots.filter((t) => t === type).length;
  const size = pools.get(type)?.length ?? 1;
  return Math.max(type === "snack" ? 3 : 2, Math.ceil(perWeek / size));
}

/** Nudge servings in quarter steps so the day lands close to the target. */
export function balanceDay(meals: PlannedMealDraft[], byId: Map<string, Candidate>, targetKcal: number): PlannedMealDraft[] {
  const out = meals.map((m) => ({ ...m }));
  for (let step = 0; step < 16; step++) {
    const total = dayNutrition(out, byId).kcal;
    const diff = targetKcal - total;
    if (Math.abs(diff) <= targetKcal * 0.03) break;
    let best: { i: number; delta: number; after: number } | null = null;
    out.forEach((m, i) => {
      const c = byId.get(m.recipeId);
      if (!c) return;
      const delta = diff > 0 ? 0.25 : -0.25;
      const next = m.servings + delta;
      if (next < MIN_SERVINGS || next > MAX_SERVINGS) return;
      const after = Math.abs(diff - c.kcal * delta);
      if (after < Math.abs(diff) && (!best || after < best.after)) best = { i, delta, after };
    });
    if (!best) break;
    const { i, delta } = best;
    out[i].servings += delta;
  }
  return out;
}

/** Assign servings for chosen recipes and balance each day. */
export function withServings(days: { mealType: MealType; recipeId: string }[][], slots: MealType[], byId: Map<string, Candidate>, targets: PlanTargets): PlanDraft {
  const perSlot = slotTargets(targets.kcal, slots);
  return {
    days: days.map((day) =>
      balanceDay(
        day.map((m, slot) => ({ slot, mealType: m.mealType, recipeId: m.recipeId, servings: servingsFor(byId.get(m.recipeId)!.kcal, perSlot[slot]) })),
        byId,
        targets.kcal,
      ),
    ),
  };
}

export interface ValidationResult {
  /** Safety or structural problems: the plan must never be shown. */
  hard: string[];
  /** Quality problems: worth a retry, acceptable from the rules planner. */
  soft: string[];
}

export function validatePlan(
  draft: PlanDraft,
  slots: MealType[],
  byId: Map<string, Candidate>,
  prefs: PlannerPrefs,
  targets: PlanTargets,
  pools: Pools,
): ValidationResult {
  const hard: string[] = [];
  const soft: string[] = [];
  if (draft.days.length !== DAYS) hard.push(`Expected ${DAYS} days, got ${draft.days.length}.`);

  const uses = new Map<string, number>();
  let proteinTotal = 0;
  draft.days.forEach((day, d) => {
    if (day.length !== slots.length) hard.push(`Day ${d + 1}: expected ${slots.length} meals, got ${day.length}.`);
    const seenToday = new Set<string>();
    day.forEach((m, s) => {
      if (m.slot !== s || m.mealType !== slots[s]) hard.push(`Day ${d + 1}: meal ${s + 1} should be ${slots[s]}.`);
      const c = byId.get(m.recipeId);
      if (!c) return hard.push(`Day ${d + 1}: unknown recipe ${m.recipeId}.`);
      const reason = rejectReason(c, prefs, m.mealType);
      if (reason) hard.push(`Day ${d + 1}: "${c.title}" is not allowed (${reason}).`);
      if (!(m.servings >= MIN_SERVINGS && m.servings <= MAX_SERVINGS) || (m.servings * 4) % 1 !== 0)
        hard.push(`Day ${d + 1}: invalid servings for "${c.title}".`);
      if (seenToday.has(c.id)) soft.push(`Day ${d + 1}: "${c.title}" appears twice.`);
      seenToday.add(c.id);
      uses.set(`${m.mealType}:${c.id}`, (uses.get(`${m.mealType}:${c.id}`) ?? 0) + 1);
    });
    const n = dayNutrition(day, byId);
    proteinTotal += n.protein;
    if (Math.abs(n.kcal - targets.kcal) > targets.kcal * KCAL_TOLERANCE)
      soft.push(`Day ${d + 1}: ${n.kcal} kcal is more than ${KCAL_TOLERANCE * 100}% from the ${targets.kcal} kcal target.`);
  });

  for (const [key, count] of uses) {
    const [type, id] = key.split(":") as [MealType, string];
    if (count > repeatCap(type, slots, pools)) soft.push(`"${byId.get(id)?.title}" is used ${count} times as ${type}.`);
  }
  const avgProtein = proteinTotal / Math.max(draft.days.length, 1);
  if (avgProtein < targets.proteinMin * 0.9)
    soft.push(`Average protein ${Math.round(avgProtein)} g/day is below the ${targets.proteinMin} g minimum.`);
  return { hard, soft };
}

/** Small seeded PRNG so plans vary between generations but tests are repeatable. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Preference score for a candidate (higher is better). */
export function preferenceScore(c: Candidate, prefs: PlannerPrefs): number {
  let score = 0;
  if (c.cuisine && prefs.cuisines.includes(c.cuisine)) score += 2;
  for (const like of prefs.likes) {
    const l = like.toLowerCase();
    if (l && (c.title.toLowerCase().includes(l) || c.ingredients.some((i) => i.terms.some((t) => t.includes(l))))) score += 1;
  }
  score += Math.min(2, ((c.protein * 4) / c.kcal) * 8); // protein density
  if (prefs.budgetConscious && c.costTier) score += (3 - c.costTier) * 0.75;
  return score;
}

/**
 * Deterministic planner: picks the best-scoring allowed recipe for each slot
 * while spreading variety. Used when AI is unavailable or its output fails
 * validation.
 */
export function rulesPlan(pools: Pools, prefs: PlannerPrefs, slots: MealType[], targets: PlanTargets, seed: number): PlanDraft {
  const rand = seededRandom(seed);
  const scored = new Map<MealType, { c: Candidate; score: number }[]>();
  for (const [type, list] of pools) {
    scored.set(type, list.map((c) => ({ c, score: preferenceScore(c, prefs) + rand() * 1.5 })).sort((a, b) => b.score - a.score));
  }
  const uses = new Map<string, number>();
  const byId = new Map([...pools.values()].flat().map((c) => [c.id, c]));
  const days: { mealType: MealType; recipeId: string }[][] = [];

  for (let d = 0; d < DAYS; d++) {
    const today = new Set<string>();
    const yesterday = new Set(days[d - 1]?.map((m) => m.recipeId) ?? []);
    const day = slots.map((type) => {
      const options = scored.get(type)!;
      const cap = repeatCap(type, slots, pools);
      const key = (c: Candidate) => `${type}:${c.id}`;
      const tiers = [
        (c: Candidate) => !today.has(c.id) && !yesterday.has(c.id) && (uses.get(key(c)) ?? 0) < cap,
        (c: Candidate) => !today.has(c.id) && (uses.get(key(c)) ?? 0) < cap,
        (c: Candidate) => !today.has(c.id),
        () => true,
      ];
      // Prefer the least-used option among the top few so the week isn't dominated by one recipe.
      let pick: Candidate | undefined;
      for (const ok of tiers) {
        const allowed = options.filter((o) => ok(o.c));
        if (allowed.length) {
          const minUse = Math.min(...allowed.slice(0, 4).map((o) => uses.get(key(o.c)) ?? 0));
          pick = allowed.slice(0, 4).find((o) => (uses.get(key(o.c)) ?? 0) === minUse)!.c;
          break;
        }
      }
      today.add(pick!.id);
      uses.set(key(pick!), (uses.get(key(pick!)) ?? 0) + 1);
      return { mealType: type, recipeId: pick!.id };
    });
    days.push(day);
  }
  return withServings(days, slots, byId, targets);
}
