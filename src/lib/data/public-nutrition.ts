import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export interface PublicNutrition {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/**
 * Per-serving nutrition for curated recipes, computed in the database from
 * USDA data. Cached for an hour; empty until the USDA import has run.
 */
export const getPublicNutrition = unstable_cache(loadPublicNutrition, ["public-nutrition"], { revalidate: 3600 });

async function loadPublicNutrition(): Promise<Record<string, PublicNutrition>> {
  const supabase = createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("recipes")
    .select("slug, nutrition_per_serving")
    .eq("visibility", "public")
    .eq("origin", "curated")
    .not("slug", "is", null);
  if (error || !data) return {};
  const out: Record<string, PublicNutrition> = {};
  for (const r of data) {
    const n = r.nutrition_per_serving as Partial<PublicNutrition>;
    if (r.slug && Number(n?.kcal) > 0) out[r.slug] = { kcal: Number(n.kcal), protein_g: Number(n.protein_g), carbs_g: Number(n.carbs_g), fat_g: Number(n.fat_g) };
  }
  return out;
}
