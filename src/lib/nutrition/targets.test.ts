import { describe, expect, it } from "vitest";
import { bmi, bmiCategory } from "./bmi";
import { mifflinStJeor, tdee } from "./bmr";
import { CALORIE_FLOOR, computeTargets } from "./targets";
import type { BodyInput } from "./types";

const base: BodyInput = { age: 30, sex: "female", heightCm: 165, weightKg: 65, activity: "light", goal: "maintain" };

function ok(input: BodyInput) {
  const r = computeTargets(input);
  if (r.status !== "ok") throw new Error(`expected ok, got ${r.reason}`);
  return r;
}

describe("Mifflin-St Jeor", () => {
  it("matches the published equation", () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    expect(mifflinStJeor(70, 175, 30, "male")).toBeCloseTo(1648.75);
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(mifflinStJeor(65, 165, 30, "female")).toBeCloseTo(1370.25);
    expect(mifflinStJeor(65, 165, 30, "unspecified")).toBeCloseTo(1453.25);
  });

  it("applies activity factors", () => {
    expect(tdee(1000, "sedentary")).toBeCloseTo(1200);
    expect(tdee(1000, "athlete")).toBeCloseTo(1900);
  });
});

describe("BMI", () => {
  it("computes and categorizes", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
    expect(bmiCategory(18.4)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("healthy");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese");
  });
});

describe("computeTargets safety rules", () => {
  it("refuses targets for minors", () => {
    expect(computeTargets({ ...base, age: 17 })).toEqual({ status: "not_applicable", reason: "under_18" });
  });

  it("refuses targets during pregnancy or with eating-disorder history", () => {
    expect(computeTargets({ ...base, flags: { pregnantOrBreastfeeding: true } })).toMatchObject({ reason: "pregnancy" });
    expect(computeTargets({ ...base, goal: "lose", flags: { eatingDisorderHistory: true } })).toMatchObject({
      reason: "eating_disorder_history",
    });
  });

  it("does not allow weight loss when underweight", () => {
    const r = ok({ ...base, weightKg: 48, goal: "lose" }); // BMI 17.6
    expect(r.appliedGoal).toBe("maintain");
    expect(r.notes).toContain("underweight_no_loss");
  });

  it("caps the deficit at 500 kcal and 20% of TDEE", () => {
    const r = ok({ ...base, sex: "male", heightCm: 185, weightKg: 100, age: 35, activity: "very_active", goal: "lose" });
    expect(r.tdee - r.calories.range.min).toBeLessThanOrEqual(505);
    const small = ok({ ...base, goal: "lose", activity: "sedentary" });
    expect(small.tdee - small.calories.range.min).toBeLessThanOrEqual(small.tdee * 0.2 + 5);
  });

  it("never goes below the calorie floor", () => {
    const r = ok({ ...base, age: 80, heightCm: 150, weightKg: 52, activity: "sedentary", goal: "lose" });
    expect(r.calories.range.min).toBeGreaterThanOrEqual(CALORIE_FLOOR.female);
    expect(r.calories.target).toBeGreaterThanOrEqual(CALORIE_FLOOR.female);
  });

  it("falls back to maintenance when a deficit would breach the floor", () => {
    const r = ok({ ...base, age: 85, heightCm: 150, weightKg: 50, activity: "sedentary", goal: "lose" });
    expect(r.appliedGoal).toBe("maintain");
    expect(r.notes).toContain("deficit_too_small");
  });

  it("produces a surplus for gain", () => {
    const r = ok({ ...base, goal: "gain" });
    expect(r.calories.range.min).toBeGreaterThan(r.tdee);
    expect(r.calories.range.max).toBeLessThanOrEqual(Math.round(r.tdee * 1.1) + 10);
  });

  it("uses a reference weight for protein when BMI > 30", () => {
    const r = ok({ ...base, weightKg: 120, goal: "lose" }); // BMI 44
    expect(r.notes).toContain("high_bmi_reference_weight");
    expect(r.protein.grams).toBeLessThan(120 * 1.6);
  });

  it("uses conservative protein with a medical condition", () => {
    const r = ok({ ...base, goal: "gain", flags: { medicalCondition: true } });
    expect(r.protein.grams).toBe(65);
    expect(r.notes).toContain("medical_condition");
  });

  it("macros add up to the calorie target", () => {
    for (const goal of ["lose", "maintain", "gain", "healthier"] as const) {
      const r = ok({ ...base, goal });
      const kcal = r.protein.grams * 4 + r.carbs.grams * 4 + r.fat.grams * 9;
      expect(Math.abs(kcal - r.calories.target)).toBeLessThan(15);
      expect(r.protein.grams * 4).toBeLessThanOrEqual(r.calories.target * 0.35 + 4);
      expect(r.calories.range.min).toBeLessThanOrEqual(r.calories.target);
      expect(r.calories.range.max).toBeGreaterThanOrEqual(r.calories.target);
    }
  });

  it("handles sweeping inputs without NaN or unsafe values", () => {
    for (let age = 18; age <= 100; age += 9)
      for (let h = 120; h <= 230; h += 22)
        for (let w = 35; w <= 250; w += 43)
          for (const goal of ["lose", "maintain", "gain"] as const) {
            const r = ok({ age, sex: "unspecified", heightCm: h, weightKg: w, activity: "moderate", goal });
            expect(Number.isFinite(r.calories.target)).toBe(true);
            expect(r.calories.target).toBeGreaterThanOrEqual(1200);
            expect(r.carbs.grams).toBeGreaterThanOrEqual(0);
          }
  });
});
