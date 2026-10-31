/**
 * Import the curated recipe library (data/recipes.ts). Run after import-fdc.
 * Nutrition, allergens and diet pattern are computed by the database from the
 * imported USDA food data.
 *
 *   npm run import:recipes
 */
import { RECIPES } from "../data/recipes";
import { adminClient } from "./lib/admin";

async function main() {
  const db = adminClient();
  const { data: foods, error } = await db.from("food_items").select("id, slug").not("slug", "is", null);
  if (error) throw error;
  const foodId = new Map(foods.map((f) => [f.slug!, f.id]));

  const unknown = RECIPES.flatMap((r) => r.ingredients.filter(([s]) => !foodId.has(s)).map(([s]) => `${r.slug}: ${s}`));
  if (unknown.length) {
    console.error(`Foods not imported yet (run npm run import:foods first):\n  ${unknown.join("\n  ")}`);
    process.exit(1);
  }

  const problems: string[] = [];
  for (const r of RECIPES) {
    const { data: recipe, error: rErr } = await db
      .from("recipes")
      .upsert(
        {
          slug: r.slug,
          title: r.title,
          description: r.description,
          cuisine: r.cuisine,
          meal_types: r.mealTypes,
          servings: r.servings,
          prep_minutes: r.prep,
          cook_minutes: r.cook,
          cost_tier: r.costTier,
          instructions: r.steps,
          origin: "curated",
          visibility: "public",
          review_status: "unreviewed",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (rErr) throw rErr;

    const { error: dErr } = await db.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);
    if (dErr) throw dErr;
    const { error: iErr } = await db.from("recipe_ingredients").insert(
      r.ingredients.map(([slug, grams, qty, unit, note], position) => ({
        recipe_id: recipe.id,
        food_item_id: foodId.get(slug)!,
        grams,
        quantity: qty ?? grams,
        unit: unit ?? "g",
        preparation_note: note ?? null,
        position,
      })),
    );
    if (iErr) throw iErr;

    const { data: check } = await db.from("recipes").select("nutrition_per_serving").eq("id", recipe.id).single();
    const kcal = Number((check?.nutrition_per_serving as { kcal?: number })?.kcal ?? 0);
    const [min, max] = r.mealTypes.length === 1 && r.mealTypes[0] === "snack" ? [40, 500] : [150, 1100];
    if (kcal < min || kcal > max) problems.push(`${r.slug}: ${kcal} kcal per serving looks wrong (expected ${min}–${max})`);
  }

  console.log(`Imported ${RECIPES.length} recipes.`);
  if (problems.length) {
    console.error(`\nSanity check failed for ${problems.length} recipe(s), please review:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
