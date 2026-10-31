/**
 * TEST FIXTURES ONLY: made-up foods and recipes for end-to-end tests of the
 * planner. Every row is tagged "TEST FIXTURE" / slug prefix "e2e"/"test_" and
 * removed after the run. Never use these values for real nutrition.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

function admin() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // CI provides the variables directly.
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}

const FOODS: [string, number, number, number, number, Enums["dietary_pattern"], Enums["allergen"][], string][] = [
  // slug, kcal, protein, carbs, fat (per 100 g), pattern, allergens, category
  ["test_oats", 380, 13, 67, 7, "vegan", ["gluten"], "grains_bakery"],
  ["test_milk", 61, 3.2, 4.8, 3.3, "vegetarian", ["dairy"], "dairy_eggs"],
  ["test_egg", 143, 12.6, 0.7, 9.5, "vegetarian", ["egg"], "dairy_eggs"],
  ["test_rice", 130, 2.7, 28, 0.3, "vegan", [], "grains_bakery"],
  ["test_beans", 132, 8.9, 23.7, 0.5, "vegan", [], "legumes_tofu"],
  ["test_chicken", 120, 22.5, 0, 2.6, "omnivore", [], "meat_fish"],
  ["test_fish", 96, 20, 0, 1.7, "pescatarian", ["fish"], "meat_fish"],
  ["test_peanut_butter", 588, 25, 20, 50, "vegan", ["peanut"], "nuts_seeds"],
  ["test_spinach", 23, 2.9, 3.6, 0.4, "vegan", [], "produce"],
  ["test_apple", 52, 0.3, 14, 0.2, "vegan", [], "produce"],
  ["test_yogurt", 59, 10, 3.6, 0.4, "vegetarian", ["dairy"], "dairy_eggs"],
  ["test_tofu", 144, 17, 3, 9, "vegan", ["soy"], "legumes_tofu"],
];

const RECIPES: [string, string, Enums["meal_type"][], [string, number][]][] = [
  ["e2e-oat-porridge", "TEST Oat porridge", ["breakfast"], [["test_oats", 60], ["test_milk", 200]]],
  ["e2e-egg-rice", "TEST Egg and rice", ["breakfast"], [["test_egg", 100], ["test_rice", 150], ["test_spinach", 50]]],
  ["e2e-tofu-scramble", "TEST Tofu scramble", ["breakfast"], [["test_tofu", 150], ["test_spinach", 60], ["test_rice", 100]]],
  ["e2e-peanut-oats", "TEST Peanut oats", ["breakfast"], [["test_oats", 60], ["test_peanut_butter", 30]]],
  ["e2e-chicken-rice", "TEST Chicken rice", ["lunch", "dinner"], [["test_chicken", 150], ["test_rice", 200], ["test_spinach", 80]]],
  ["e2e-bean-bowl", "TEST Bean bowl", ["lunch", "dinner"], [["test_beans", 200], ["test_rice", 150], ["test_spinach", 50]]],
  ["e2e-fish-rice", "TEST Fish rice", ["lunch", "dinner"], [["test_fish", 180], ["test_rice", 200], ["test_spinach", 100]]],
  ["e2e-tofu-rice", "TEST Tofu rice", ["lunch", "dinner"], [["test_tofu", 200], ["test_rice", 200], ["test_spinach", 80]]],
  ["e2e-peanut-noodles", "TEST Peanut noodles", ["lunch", "dinner"], [["test_peanut_butter", 40], ["test_rice", 200], ["test_spinach", 50]]],
  ["e2e-apple", "TEST Apple", ["snack"], [["test_apple", 150]]],
  ["e2e-yogurt", "TEST Yogurt", ["snack"], [["test_yogurt", 170]]],
  ["e2e-apple-pb", "TEST Apple and peanut butter", ["snack"], [["test_apple", 150], ["test_peanut_butter", 16]]],
];

export async function seedFixtures() {
  const db = admin();
  await cleanupFixtures();
  const { data: foods, error } = await db
    .from("food_items")
    .insert(
      FOODS.map(([slug, kcal, protein_g, carbs_g, fat_g, dietary_pattern, allergens, category]) => ({
        slug, name: `TEST FIXTURE ${slug.slice(5)}`, display_name: `TEST ${slug.slice(5).replace("_", " ")}`, category,
        kcal, protein_g, carbs_g, fat_g, dietary_pattern, allergens,
        source_name: "TEST FIXTURE (not real data)", source_reference: "test", source_updated_at: "2026-01-01", license: "test",
      })),
    )
    .select("id, slug");
  if (error) throw error;
  const ids = new Map(foods.map((f) => [f.slug!, f.id]));
  for (const [slug, title, meal_types, ings] of RECIPES) {
    const { data: r, error: rErr } = await db
      .from("recipes")
      .insert({ slug, title, servings: 1, meal_types, origin: "curated", visibility: "public", instructions: ["Test step."], cuisine: "International", prep_minutes: 5, cook_minutes: 10 })
      .select("id")
      .single();
    if (rErr) throw rErr;
    const { error: iErr } = await db
      .from("recipe_ingredients")
      .insert(ings.map(([food, grams], position) => ({ recipe_id: r.id, food_item_id: ids.get(food)!, grams, quantity: grams, unit: "g", position })));
    if (iErr) throw iErr;
  }
}

export async function cleanupFixtures() {
  const db = admin();
  await db.from("recipes").delete().like("slug", "e2e-%");
  await db.from("food_items").delete().like("slug", "test\\_%");
}
