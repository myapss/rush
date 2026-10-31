import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./onboarding";

const schema = onboardingSchema(2026);
const valid = {
  displayName: "Ada",
  country: "NG",
  currency: "NGN",
  units: "metric",
  birthYear: "1990",
  sex: "female",
  heightCm: "165",
  weightKg: "62",
  activity: "light",
  goal: "maintain",
  healthConsent: "on",
  dietaryPattern: "vegetarian",
  allergies: ["peanut"],
  restrictions: [],
  cuisines: ["Nigerian", "Indian"],
  likedFoods: "beans, plantain, beans",
  dislikedFoods: "",
  mealsPerDay: "3",
  includeSnacks: "on",
  maxCookMinutes: "30",
  cookingSkill: "easy",
  budgetAmount: "",
  budgetPeriod: "week",
};

describe("onboarding schema", () => {
  it("accepts valid input and normalizes it", () => {
    const r = schema.parse(valid);
    expect(r.profile.height_cm).toBe(165);
    expect(r.profile.sex_for_calc).toBe("female");
    expect(r.preferences.liked_foods).toEqual(["beans", "plantain"]);
    expect(r.preferences.budget_amount).toBeNull();
    expect(r.preferences.budget_period).toBeNull();
  });

  it("converts imperial units", () => {
    const r = schema.parse({ ...valid, units: "imperial", heightFt: "5", heightIn: "5", weightLb: "140" });
    expect(r.profile.height_cm).toBe(165.1);
    expect(r.profile.weight_kg).toBe(63.5);
  });

  it("rejects users under 18", () => {
    const r = schema.safeParse({ ...valid, birthYear: "2010" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/18/);
  });

  it("requires consent before storing body or health data", () => {
    const r = schema.safeParse({ ...valid, healthConsent: undefined });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path[0] === "healthConsent")).toBe(true);
  });

  it("allows skipping body data without consent", () => {
    const r = schema.parse({ ...valid, healthConsent: undefined, heightCm: "", weightKg: "" });
    expect(r.profile.height_cm).toBeNull();
    expect(r.profile.sex_for_calc).toBeNull();
    expect(r.profile.health_flags).toEqual({});
  });

  it("rejects out-of-range and unknown values", () => {
    expect(schema.safeParse({ ...valid, heightCm: "300" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, allergies: ["chocolate"] }).success).toBe(false);
    expect(schema.safeParse({ ...valid, cuisines: ["<script>"] }).success).toBe(false);
    expect(schema.safeParse({ ...valid, country: "XX" }).success).toBe(false);
  });
});

describe("onboarding schema error reporting", () => {
  it("reports age and consent problems together", () => {
    const r = schema.safeParse({ ...valid, birthYear: "2015", healthConsent: undefined });
    const paths = r.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain("birthYear");
    expect(paths).toContain("healthConsent");
  });
});
