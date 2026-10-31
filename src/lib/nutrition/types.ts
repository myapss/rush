export const SEXES = ["female", "male", "unspecified"] as const;
export type Sex = (typeof SEXES)[number];

export const GOALS = ["lose", "maintain", "gain", "healthier"] as const;
export type Goal = (typeof GOALS)[number];

export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "very_active", "athlete"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export interface HealthFlags {
  /** Pregnant or breastfeeding. */
  pregnantOrBreastfeeding?: boolean;
  /** Current or past eating disorder. */
  eatingDisorderHistory?: boolean;
  /** A medical condition that affects diet (e.g. diabetes, kidney disease). */
  medicalCondition?: boolean;
}

export interface BodyInput {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  flags?: HealthFlags;
}

export interface Range {
  min: number;
  max: number;
}

export interface MacroTarget {
  grams: number;
  range: Range;
}

export type NoteCode =
  | "underweight_no_loss"
  | "deficit_too_small"
  | "calorie_floor_applied"
  | "medical_condition"
  | "high_bmi_reference_weight"
  | "estimate_only";

export type NotApplicableReason = "under_18" | "pregnancy" | "eating_disorder_history";

export type TargetsResult =
  | {
      status: "ok";
      bmi: number;
      bmr: number;
      tdee: number;
      /** Goal actually applied after safety rules (may differ from the requested goal). */
      appliedGoal: Goal;
      calories: { target: number; range: Range };
      protein: MacroTarget;
      fat: MacroTarget;
      carbs: MacroTarget;
      notes: NoteCode[];
    }
  | { status: "not_applicable"; reason: NotApplicableReason };
