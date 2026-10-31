/**
 * Import curated foods (data/foods.ts) from the official USDA FoodData Central
 * SR Legacy CSV download into food_items / food_portions.
 *
 *   1. Download "SR Legacy" (CSV) from https://fdc.nal.usda.gov/download-datasets
 *   2. Unzip it, then run:
 *        npm run import:foods -- <path-to-extracted-folder>
 *
 * Every curated description must match exactly; otherwise the script lists
 * near matches and exits without writing anything.
 */
import { FOODS } from "../data/foods";
import { adminClient } from "./lib/admin";
import { loadFdcFoods, missingRequiredNutrients } from "./lib/fdc";

const SOURCE_NAME = "USDA FoodData Central – SR Legacy";
const LICENSE = "CC0 1.0 (public domain)";

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("Usage: npm run import:foods -- <path-to-extracted-SR-Legacy-CSV-folder>");

  const { found, missing } = await loadFdcFoods(dir, FOODS.map((f) => f.fdc));
  if (missing.length) {
    console.error(`\n${missing.length} curated description(s) not found in SR Legacy:\n`);
    for (const m of missing) console.error(`  ✗ "${m.description}"\n      closest: ${m.suggestions.map((s) => `"${s}"`).join("\n               ")}`);
    console.error("\nFix data/foods.ts and re-run. Nothing was written.");
    process.exit(1);
  }
  const incomplete = FOODS.filter((f) => missingRequiredNutrients(found.get(f.fdc)!).length);
  if (incomplete.length) {
    for (const f of incomplete) console.error(`  ✗ ${f.slug}: missing ${missingRequiredNutrients(found.get(f.fdc)!).join(", ")}`);
    process.exit(1);
  }

  const db = adminClient();
  const rows = FOODS.map((f) => {
    const src = found.get(f.fdc)!;
    const n = src.nutrients;
    return {
      slug: f.slug,
      name: src.description,
      display_name: f.name,
      aliases: f.aliases ?? [],
      category: f.category,
      fdc_id: src.fdcId,
      kcal: n.kcal!,
      protein_g: n.protein_g!,
      carbs_g: n.carbs_g!,
      fat_g: n.fat_g!,
      fibre_g: n.fibre_g ?? null,
      sugar_g: n.sugar_g ?? null,
      sat_fat_g: n.sat_fat_g ?? null,
      sodium_mg: n.sodium_mg ?? null,
      allergens: f.allergens ?? [],
      restrictions: f.restrictions ?? [],
      dietary_pattern: f.pattern,
      source_name: SOURCE_NAME,
      source_reference: `fdc:${src.fdcId}`,
      source_updated_at: src.publicationDate || "2018-04-01",
      license: LICENSE,
    };
  });

  const { data: saved, error } = await db.from("food_items").upsert(rows, { onConflict: "slug" }).select("id, slug, fdc_id");
  if (error) throw error;

  const ids = new Map(saved.map((r) => [r.slug!, r.id]));
  const portions = FOODS.flatMap((f) =>
    found.get(f.fdc)!.portions.map((p) => ({
      food_item_id: ids.get(f.slug)!,
      amount: p.amount,
      unit: p.unit,
      description: p.description,
      gram_weight: p.gramWeight,
    })),
  );
  const { error: delErr } = await db.from("food_portions").delete().in("food_item_id", [...ids.values()]);
  if (delErr) throw delErr;
  if (portions.length) {
    const { error: pErr } = await db.from("food_portions").upsert(portions, { onConflict: "food_item_id,amount,unit,description", ignoreDuplicates: true });
    if (pErr) throw pErr;
  }
  console.log(`Imported ${rows.length} foods and ${portions.length} household portions from ${SOURCE_NAME}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
