import { bmi as calcBmi, weightForBmi } from "./bmi";
import { mifflinStJeor, tdee as calcTdee } from "./bmr";
import type { BodyInput, Goal, MacroTarget, NoteCode, Range, Sex, TargetsResult } from "./types";

/** Minimum daily intake we will ever suggest without medical supervision. */
export const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500, unspecified: 1200 };
/** Largest deficit: 20% of TDEE, and never more than 500 kcal/day. */
export const MAX_DEFICIT_FRACTION = 0.2;
export const MAX_DEFICIT_KCAL = 500;
/** Surplus for weight gain: 5–10% of TDEE. */
export const SURPLUS_RANGE = { min: 0.05, max: 0.1 };
/** Maintenance band: ±5% of TDEE. */
export const MAINTENANCE_BAND = 0.05;

/** Protein in g per kg of reference body weight, by goal. */
const PROTEIN_G_PER_KG: Record<Goal, { target: number; min: number; max: number }> = {
  lose: { target: 1.6, min: 1.2, max: 2.0 },
  maintain: { target: 1.2, min: 0.8, max: 1.6 },
  healthier: { target: 1.2, min: 0.8, max: 1.6 },
  gain: { target: 1.8, min: 1.6, max: 2.2 },
};
/** Conservative protein for users who report a medical condition (e.g. kidney disease). */
const PROTEIN_MEDICAL = { target: 1.0, min: 0.8, max: 1.2 };
/** Fat as a share of calories (in line with WHO/EFSA guidance of roughly 20–35%). */
const FAT_SHARE = { target: 0.3, min: 0.25, max: 0.35 };
/** Protein should not exceed this share of calories. */
const MAX_PROTEIN_SHARE = 0.35;

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Deterministic calorie and macronutrient estimates with safety guardrails.
 * See docs/calculations.md for the method and rationale.
 */
export function computeTargets(input: BodyInput): TargetsResult {
  const { age, sex, heightCm, weightKg, activity, flags = {} } = input;

  if (age < 18) return { status: "not_applicable", reason: "under_18" };
  if (flags.pregnantOrBreastfeeding) return { status: "not_applicable", reason: "pregnancy" };
  if (flags.eatingDisorderHistory) return { status: "not_applicable", reason: "eating_disorder_history" };

  const notes: NoteCode[] = ["estimate_only"];
  const bmi = calcBmi(weightKg, heightCm);
  const bmr = mifflinStJeor(weightKg, heightCm, age, sex);
  const tdee = calcTdee(bmr, activity);
  const floor = CALORIE_FLOOR[sex];

  let goal = input.goal;
  if (goal === "lose" && bmi < 18.5) {
    goal = "maintain";
    notes.push("underweight_no_loss");
  }

  let raw: Range | null = null;
  if (goal === "lose") {
    // If the floor leaves less than 100 kcal of deficit, a weight-loss
    // target isn't meaningful; fall back to maintenance.
    if (tdee - floor < 100) {
      goal = "maintain";
      notes.push("deficit_too_small");
    } else {
      const deficit = Math.min(tdee * MAX_DEFICIT_FRACTION, MAX_DEFICIT_KCAL);
      raw = { min: tdee - deficit, max: tdee - deficit / 2 };
    }
  }
  if (!raw) {
    raw =
      goal === "gain"
        ? { min: tdee * (1 + SURPLUS_RANGE.min), max: tdee * (1 + SURPLUS_RANGE.max) }
        : { min: tdee * (1 - MAINTENANCE_BAND), max: tdee * (1 + MAINTENANCE_BAND) };
  }
  if (raw.min < floor) notes.push("calorie_floor_applied");
  const range: Range = { min: Math.max(round10(raw.min), floor), max: Math.max(round10(raw.max), floor) };
  const target = round10((range.min + range.max) / 2);

  // Protein is based on a reference weight (BMI 25) when BMI > 30, so it
  // isn't inflated by excess body fat.
  let refWeight = weightKg;
  if (bmi > 30) {
    refWeight = weightForBmi(25, heightCm);
    notes.push("high_bmi_reference_weight");
  }
  const perKg = flags.medicalCondition ? PROTEIN_MEDICAL : PROTEIN_G_PER_KG[goal];
  if (flags.medicalCondition) notes.push("medical_condition");
  const maxProteinG = (target * MAX_PROTEIN_SHARE) / 4;
  const protein: MacroTarget = {
    grams: Math.round(Math.min(refWeight * perKg.target, maxProteinG)),
    range: {
      min: Math.round(Math.min(refWeight * perKg.min, maxProteinG)),
      max: Math.round(Math.min(refWeight * perKg.max, maxProteinG)),
    },
  };
  const fat: MacroTarget = {
    grams: Math.round((target * FAT_SHARE.target) / 9),
    range: { min: Math.round((target * FAT_SHARE.min) / 9), max: Math.round((target * FAT_SHARE.max) / 9) },
  };
  // Carbohydrate is the remainder after protein and fat.
  const carbsG = (kcal: number, p: number, f: number) => Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  const carbs: MacroTarget = {
    grams: carbsG(target, protein.grams, fat.grams),
    range: {
      min: carbsG(range.min, protein.range.max, fat.range.max),
      max: carbsG(range.max, protein.range.min, fat.range.min),
    },
  };

  return {
    status: "ok",
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    appliedGoal: goal,
    calories: { target, range },
    protein,
    fat,
    carbs,
    notes,
  };
}
