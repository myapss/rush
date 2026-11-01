import { z } from "zod";
import { ACTIVITY_LEVELS, GOALS, SEXES } from "@/lib/nutrition/types";
import { COUNTRY_CODES, CUISINES } from "@/lib/reference";
import { Constants } from "@/lib/supabase/database.types";
import { cmFromFeetInches, kgFromLb } from "@/lib/units";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Comma-separated free text → trimmed, de-duplicated list. */
const textList = (maxItems: number, maxLen: number) =>
  z.preprocess(
    (v) =>
      typeof v === "string"
        ? [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))]
        : v,
    z.array(z.string().max(maxLen, `Each item must be ${maxLen} characters or fewer`)).max(maxItems, `Up to ${maxItems} items`),
  );

const { allergen: ALLERGEN_VALUES, food_restriction: RESTRICTION_VALUES, dietary_pattern: PATTERN_VALUES } =
  Constants.public.Enums;
const allergen = z.enum(ALLERGEN_VALUES);
const restriction = z.enum(RESTRICTION_VALUES);

export const MIN_AGE = 18;

/**
 * Raw form input → validated, normalized (metric) values.
 * `currentYear` is injected so the rule is testable.
 */
export function onboardingSchema(currentYear: number) {
  return z
    .object({
      displayName: z.string().trim().max(80).optional().default(""),
      country: z.enum(COUNTRY_CODES as [string, ...string[]], { message: "Choose your country" }),
      currency: z.string().regex(/^[A-Z]{3}$/, "Choose a currency"),
      units: z.enum(["metric", "imperial"]),

      birthYear: z.coerce
        .number({ message: "Enter your birth year" })
        .int()
        .min(currentYear - 110, "Enter a valid birth year")
        .max(currentYear, "Enter a valid birth year"),
      sex: z.enum(SEXES),
      heightCm: optionalNumber,
      heightFt: optionalNumber,
      heightIn: optionalNumber,
      weightKg: optionalNumber,
      weightLb: optionalNumber,
      activity: z.enum(ACTIVITY_LEVELS),
      goal: z.enum(GOALS),

      pregnantOrBreastfeeding: checkbox,
      eatingDisorderHistory: checkbox,
      medicalCondition: checkbox,
      healthConsent: checkbox,

      dietaryPattern: z.enum(PATTERN_VALUES),
      allergies: z.array(allergen).default([]),
      restrictions: z.array(restriction).default([]),
      cuisines: z.array(z.enum(CUISINES)).max(12, "Choose up to 12 cuisines").default([]),
      likedFoods: textList(30, 60),
      dislikedFoods: textList(30, 60),
      mealsPerDay: z.coerce.number().int().min(2).max(6),
      includeSnacks: checkbox,
      maxCookMinutes: z.preprocess(
        (v) => (v === "" || v === undefined ? undefined : Number(v)),
        z.number().int().min(5).max(240).optional(),
      ),
      cookingSkill: z.enum(["easy", "medium", "advanced"]),
      budgetAmount: z.preprocess(
        (v) => (v === "" || v === undefined ? undefined : Number(v)),
        z.number().min(0).max(100000).optional(),
      ),
      budgetPeriod: z.enum(["day", "week"]).default("week"),
    })
    .transform((d, ctx) => {
      // All cross-field rules run here so every problem is reported at once.
      if (currentYear - d.birthYear < MIN_AGE) {
        ctx.addIssue({ code: "custom", path: ["birthYear"], message: "ChopPlanner is for adults aged 18 and over." });
      }
      const heightCm =
        d.units === "metric"
          ? d.heightCm
          : d.heightFt !== undefined
            ? cmFromFeetInches(d.heightFt, d.heightIn ?? 0)
            : undefined;
      const weightKg = d.units === "metric" ? d.weightKg : d.weightLb !== undefined ? kgFromLb(d.weightLb) : undefined;
      const hasBody = heightCm !== undefined || weightKg !== undefined;

      if (heightCm !== undefined && (heightCm < 120 || heightCm > 230)) {
        ctx.addIssue({ code: "custom", path: ["height"], message: "Enter a height between 120 and 230 cm (3 ft 11 in – 7 ft 6 in)." });
      }
      if (weightKg !== undefined && (weightKg < 35 || weightKg > 250)) {
        ctx.addIssue({ code: "custom", path: ["weight"], message: "Enter a weight between 35 and 250 kg (77 – 551 lb)." });
      }
      if ((heightCm === undefined) !== (weightKg === undefined)) {
        ctx.addIssue({ code: "custom", path: ["weight"], message: "Enter both height and weight, or leave both empty." });
      }
      const hasFlags = d.pregnantOrBreastfeeding || d.eatingDisorderHistory || d.medicalCondition;
      if ((hasBody || hasFlags) && !d.healthConsent) {
        ctx.addIssue({
          code: "custom",
          path: ["healthConsent"],
          message: "To save body measurements or health information, please give consent below, or leave those fields empty.",
        });
      }

      return {
        profile: {
          display_name: d.displayName || null,
          country: d.country,
          currency: d.currency,
          measurement_unit: d.units,
          birth_year: d.birthYear,
          sex_for_calc: d.healthConsent ? d.sex : null,
          height_cm: d.healthConsent && heightCm !== undefined ? Math.round(heightCm * 10) / 10 : null,
          weight_kg: d.healthConsent && weightKg !== undefined ? Math.round(weightKg * 10) / 10 : null,
          health_flags: d.healthConsent
            ? {
                pregnantOrBreastfeeding: d.pregnantOrBreastfeeding,
                eatingDisorderHistory: d.eatingDisorderHistory,
                medicalCondition: d.medicalCondition,
              }
            : {},
        },
        healthConsent: d.healthConsent,
        preferences: {
          goal: d.goal,
          activity_level: d.activity,
          dietary_pattern: d.dietaryPattern,
          allergies: d.allergies,
          food_restrictions: d.restrictions,
          preferred_cuisines: d.cuisines,
          liked_foods: d.likedFoods,
          disliked_foods: d.dislikedFoods,
          meals_per_day: d.mealsPerDay,
          include_snacks: d.includeSnacks,
          max_cook_minutes: d.maxCookMinutes ?? null,
          cooking_skill: d.cookingSkill,
          budget_amount: d.budgetAmount ?? null,
          budget_period: d.budgetAmount !== undefined ? d.budgetPeriod : null,
        },
      };
    });
}

export type OnboardingData = z.output<ReturnType<typeof onboardingSchema>>;

/** FormData → plain object, keeping multi-value checkbox groups as arrays. */
export function formDataToObject(fd: FormData): Record<string, unknown> {
  const multi = new Set(["allergies", "restrictions", "cuisines"]);
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    out[key] = multi.has(key) ? fd.getAll(key) : fd.get(key);
  }
  for (const key of multi) out[key] ??= [];
  return out;
}
