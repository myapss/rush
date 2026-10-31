export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

/** Body mass index: weight(kg) / height(m)². */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** WHO adult BMI categories. Not valid for children, pregnancy, or very muscular people. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 25) return "healthy";
  if (value < 30) return "overweight";
  return "obese";
}

/** Weight (kg) that gives the given BMI at this height. */
export function weightForBmi(targetBmi: number, heightCm: number): number {
  const m = heightCm / 100;
  return targetBmi * m * m;
}
