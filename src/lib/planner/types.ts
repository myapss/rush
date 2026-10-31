import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type MealType = Enums["meal_type"];
export type DietaryPattern = Enums["dietary_pattern"];
export type Allergen = Enums["allergen"];
export type Restriction = Enums["food_restriction"];

export interface CandidateIngredient {
  foodItemId: number;
  name: string;
  /** Lowercase name + aliases, for matching dislikes and pantry searches. */
  terms: string[];
  category: string;
  grams: number;
  allergens: Allergen[];
  restrictions: Restriction[];
  pattern: DietaryPattern;
}

/** A recipe with nutrition per serving (computed in the database from food data). */
export interface Candidate {
  id: string;
  title: string;
  cuisine: string | null;
  mealTypes: MealType[];
  servings: number;
  totalMinutes: number;
  costTier: number | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  pattern: DietaryPattern;
  allergens: Allergen[];
  restrictions: Restriction[];
  ingredients: CandidateIngredient[];
}

export interface PlannerPrefs {
  pattern: DietaryPattern;
  allergies: Allergen[];
  restrictions: Restriction[];
  dislikes: string[];
  likes: string[];
  cuisines: string[];
  maxCookMinutes: number | null;
  mealsPerDay: number;
  includeSnacks: boolean;
  /** Prefer cheaper recipes when the user set a budget. */
  budgetConscious: boolean;
}

export interface PlanTargets {
  kcal: number;
  proteinMin: number;
}

export interface PlannedMealDraft {
  slot: number;
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface PlanDraft {
  days: PlannedMealDraft[][];
}

export interface Nutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
