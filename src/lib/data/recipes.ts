import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getRecipe(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, description, cuisine, meal_types, servings, prep_minutes, cook_minutes, instructions, dietary_pattern, allergen_tags, restriction_tags, nutrition_per_serving, origin, review_status, recipe_ingredients(grams, quantity, unit, preparation_note, position, food_items(id, name, display_name, fdc_id, source_name, source_reference))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load recipe: ${error.message}`);
  return data;
}
