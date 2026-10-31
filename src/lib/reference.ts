import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const ALLERGENS: { value: Enums["allergen"]; label: string }[] = [
  { value: "gluten", label: "Gluten (wheat, barley, rye)" },
  { value: "dairy", label: "Milk / dairy" },
  { value: "egg", label: "Eggs" },
  { value: "peanut", label: "Peanuts" },
  { value: "tree_nut", label: "Tree nuts" },
  { value: "soy", label: "Soy" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Crustacean shellfish" },
  { value: "mollusc", label: "Molluscs" },
  { value: "sesame", label: "Sesame" },
  { value: "mustard", label: "Mustard" },
  { value: "celery", label: "Celery" },
  { value: "lupin", label: "Lupin" },
  { value: "sulphite", label: "Sulphites" },
];

export const FOOD_RESTRICTIONS: { value: Enums["food_restriction"]; label: string }[] = [
  { value: "pork", label: "No pork" },
  { value: "beef", label: "No beef" },
  { value: "alcohol", label: "No alcohol in cooking" },
];

export const DIETARY_PATTERNS: { value: Enums["dietary_pattern"]; label: string }[] = [
  { value: "omnivore", label: "Everything" },
  { value: "pescatarian", label: "Pescatarian (fish, no meat)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

export const GOAL_OPTIONS: { value: Enums["goal"]; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain", label: "Build muscle / gain weight" },
  { value: "healthier", label: "Eat healthier" },
];

export const ACTIVITY_OPTIONS: { value: Enums["activity_level"]; label: string }[] = [
  { value: "sedentary", label: "Sedentary: little or no exercise" },
  { value: "light", label: "Light: exercise 1–3 days a week" },
  { value: "moderate", label: "Moderate: exercise 3–5 days a week" },
  { value: "very_active", label: "Very active: exercise 6–7 days a week" },
  { value: "athlete", label: "Athlete: hard training or a physical job" },
];

export const CUISINES = [
  "American", "British", "Nigerian", "West African", "East African", "Indian", "Mexican", "Italian",
  "Mediterranean", "Middle Eastern", "Japanese", "Chinese", "Korean", "Thai",
  "Vietnamese", "Brazilian", "Caribbean", "Ethiopian", "French", "Spanish", "Greek", "Moroccan",
] as const;

/** Common currencies; any ISO 4217 code is accepted by the database. */
export const CURRENCIES = [
  "USD", "EUR", "GBP", "NGN", "INR", "CAD", "AUD", "NZD", "ZAR", "KES", "GHS", "EGP",
  "AED", "SAR", "PKR", "BDT", "MXN", "BRL", "ARS", "COP", "JPY", "CNY", "KRW", "SGD",
  "MYR", "IDR", "PHP", "THB", "VND", "TRY", "CHF", "SEK", "NOK", "DKK", "PLN",
] as const;

/** ISO 3166-1 alpha-2 codes. Names come from Intl.DisplayNames at render time. */
export const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ " +
  "CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR " +
  "GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH " +
  "KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT " +
  "MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU " +
  "RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW " +
  "TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW"
).split(" ");

export function countryOptions(locale = "en"): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );
}
