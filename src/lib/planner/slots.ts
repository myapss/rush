import type { MealType } from "./types";

const LAYOUTS: Record<number, MealType[]> = {
  2: ["lunch", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "snack", "dinner"],
  5: ["breakfast", "snack", "lunch", "snack", "dinner"],
  6: ["breakfast", "snack", "lunch", "snack", "dinner", "snack"],
};

/** Meal slots for one day. With snacks off, extra slots become main meals' share. */
export function buildSlots(mealsPerDay: number, includeSnacks: boolean): MealType[] {
  const n = Math.min(6, Math.max(2, Math.round(mealsPerDay)));
  const layout = LAYOUTS[n];
  if (includeSnacks) return layout;
  const mains = layout.filter((t) => t !== "snack");
  return mains.length ? mains : ["breakfast", "lunch", "dinner"];
}

const WEIGHT: Record<MealType, number> = { breakfast: 0.25, lunch: 0.33, dinner: 0.35, snack: 0.1 };

/** Split the daily calorie target across slots by typical meal size. */
export function slotTargets(dailyKcal: number, slots: MealType[]): number[] {
  const total = slots.reduce((s, t) => s + WEIGHT[t], 0);
  return slots.map((t) => (dailyKcal * WEIGHT[t]) / total);
}

export const MIN_SERVINGS = 0.5;
export const MAX_SERVINGS = 3;

/** Servings that bring a recipe close to a slot's calories, in quarter steps. */
export function servingsFor(kcalPerServing: number, slotKcal: number): number {
  const raw = slotKcal / kcalPerServing;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(raw * 4) / 4));
}
