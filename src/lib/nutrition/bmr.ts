import type { ActivityLevel, Sex } from "./types";

/**
 * Physical activity multipliers applied to BMR to estimate TDEE.
 * Commonly used values (Katch-McArdle/Harris-Benedict activity factors).
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

const SEX_CONSTANT: Record<Sex, number> = {
  male: 5,
  female: -161,
  // Midpoint of the male and female constants, for users who prefer not to say.
  unspecified: -78,
};

/**
 * Basal metabolic rate (kcal/day) using the Mifflin-St Jeor equation (1990):
 *   BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) + s
 * where s = +5 for males and −161 for females.
 */
export function mifflinStJeor(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + SEX_CONSTANT[sex];
}

export function tdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activity];
}
