import "server-only";
import { AiError, aiConfigured, type AiUsage } from "@/lib/ai/client";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { plannerPrefs } from "@/lib/planner/prefs";
import type { MealType } from "@/lib/planner/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { aiRecipeIdeas } from "./ai";
import { excludeReason, matchPantry, type CatalogFood, type ExcludeReason } from "./catalog";
import { validateIdea, type ValidRecipe } from "./validate";

export interface GenerateInput {
  have: string[];
  mealType: MealType | null;
  servings: number;
  maxMinutes: number | null;
  notes: string;
}

export type GenerateResult =
  | { ok: true; recipeIds: string[]; leftOut: { input: string; food: string; reason: ExcludeReason }[]; unknown: string[] }
  | { ok: false; reason: "not_configured" | "quota" | "no_ingredients" | "no_valid" | "error"; message: string; leftOut?: { input: string; food: string; reason: ExcludeReason }[] };

const MAX_ATTEMPTS = 2;

async function loadCatalog(): Promise<CatalogFood[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_items")
    .select("id, name, display_name, aliases, category, allergens, restrictions, dietary_pattern, kcal, protein_g, carbs_g, fat_g, slug")
    .not("slug", "is", null)
    .order("display_name");
  if (error) throw new Error(`Could not load foods: ${error.message}`);
  return data.map((f) => ({
    id: f.id,
    name: f.name,
    displayName: f.display_name ?? f.name,
    terms: [f.name, f.display_name ?? "", ...f.aliases].filter(Boolean).map((t) => t.toLowerCase()),
    category: f.category,
    allergens: f.allergens,
    restrictions: f.restrictions,
    pattern: f.dietary_pattern,
    kcal: Number(f.kcal),
    protein: Number(f.protein_g),
    carbs: Number(f.carbs_g),
    fat: Number(f.fat_g),
  }));
}

async function finishEvent(eventId: number, status: "ok" | "invalid" | "error", usage: AiUsage[]) {
  const t = usage.reduce((a, u) => ({ i: a.i + u.inputTokens, o: a.o + u.outputTokens, c: a.c + (u.costUsd ?? 0), l: a.l + u.latencyMs }), { i: 0, o: 0, c: 0, l: 0 });
  const { error } = await createAdminClient()
    .from("ai_events")
    .update({ status, model: usage[0]?.model ?? null, input_tokens: usage.length ? t.i : null, output_tokens: usage.length ? t.o : null, cost_usd_est: usage.length ? Number(t.c.toFixed(6)) : null, latency_ms: usage.length ? t.l : null })
    .eq("id", eventId);
  if (error) console.error("could not update ai_event", eventId, error.message);
}

/** Generate, validate and save AI recipe ideas for the signed-in user. */
export async function generateRecipes(userId: string, input: GenerateInput): Promise<GenerateResult> {
  if (!aiConfigured()) {
    return { ok: false, reason: "not_configured", message: "The AI recipe generator isn't available yet. Try the recipe finder with your ingredients instead." };
  }
  const supabase = await createClient();
  const { preferences } = await getProfileAndPreferences(userId);
  if (!preferences) return { ok: false, reason: "error", message: "Please finish setting up your profile first." };
  const prefs = plannerPrefs(preferences);

  const foods = await loadCatalog();
  const allowed = foods.filter((f) => excludeReason(f, prefs) === null);
  const { matches, unknown } = matchPantry(input.have, foods, prefs);
  const leftOut = matches.flatMap((m) => (m.allowed.length ? [] : m.excluded.map((e) => ({ input: m.input, food: e.food.displayName, reason: e.reason }))));
  const haveIds = new Set(matches.flatMap((m) => m.allowed.map((f) => f.id)));
  if (allowed.length < 5) return { ok: false, reason: "no_ingredients", message: "The food database hasn't been loaded yet." };
  if (input.have.length && haveIds.size === 0) {
    return {
      ok: false,
      reason: "no_ingredients",
      message: "None of the ingredients you listed can be used with your allergies and preferences, or we don't have them in our food database yet.",
      leftOut,
    };
  }

  const { data: eventId, error: quotaError } = await supabase.rpc("consume_quota", { p_feature: "recipe" });
  if (quotaError) return { ok: false, reason: "error", message: "We couldn't check your recipe allowance. Please try again." };
  if (eventId === null) return { ok: false, reason: "quota", message: "You've used all your AI recipe generations for this month." };

  const usage: AiUsage[] = [];
  const valid: ValidRecipe[] = [];
  try {
    let feedback: string[] | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && valid.length === 0; attempt++) {
      try {
        const res = await aiRecipeIdeas({
          catalog: allowed,
          haveCodes: [...codesFor(allowed, haveIds)],
          mealType: input.mealType,
          servings: input.servings,
          maxMinutes: input.maxMinutes ?? prefs.maxCookMinutes,
          cuisines: prefs.cuisines,
          notes: input.notes,
          feedback,
        });
        usage.push(res.usage);
        const problems: string[] = [];
        for (const idea of res.ideas) {
          const v = validateIdea(idea, res.codeToFood, prefs, { maxMinutes: input.maxMinutes ?? prefs.maxCookMinutes, mealType: input.mealType });
          if (v.ok) valid.push(v.recipe);
          else problems.push(`"${idea.title}": ${v.problems.join("; ")}`);
        }
        feedback = problems.slice(0, 8);
      } catch (e) {
        if (!(e instanceof AiError)) throw e;
        if (e.usage) usage.push(e.usage);
        console.warn("AI recipe attempt failed:", e.kind, e.message);
        if (e.kind === "api" || e.kind === "refusal") break;
      }
    }

    if (!valid.length) {
      // Nothing usable: don't charge the user's allowance.
      await finishEvent(eventId, "error", usage);
      return { ok: false, reason: "no_valid", message: "We couldn't create a recipe that meets your requirements this time. Please try different ingredients, or allow a little more cooking time." };
    }

    const recipeIds: string[] = [];
    for (const r of valid) recipeIds.push(await saveRecipe(userId, r, eventId));
    await finishEvent(eventId, "ok", usage);
    return { ok: true, recipeIds, leftOut, unknown };
  } catch (e) {
    await finishEvent(eventId, "error", usage);
    console.error("recipe generation failed", e);
    return { ok: false, reason: "error", message: "Something went wrong while creating your recipe. You haven't used an allowance; please try again." };
  }
}

/** Codes are assigned by catalog position, so map the user's foods to them. */
function codesFor(allowed: CatalogFood[], haveIds: Set<number>) {
  return allowed.flatMap((f, i) => (haveIds.has(f.id) ? [`F${i + 1}`] : []));
}

async function saveRecipe(userId: string, r: ValidRecipe, eventId: number): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: r.title,
      description: r.description,
      instructions: r.steps,
      prep_minutes: r.prepMinutes,
      cook_minutes: r.cookMinutes,
      servings: r.servings,
      meal_types: [r.mealType],
      origin: "ai_generated",
      visibility: "private",
      review_status: "unreviewed",
      created_by: userId,
      ai_event_id: eventId,
      substitutions: r.substitutions.map((s) => ({ instead_of: s.insteadOf.displayName, use: s.use.displayName, tip: s.tip })),
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: iErr } = await supabase.from("recipe_ingredients").insert(
    r.ingredients.map((i, position) => ({ recipe_id: data.id, food_item_id: i.food.id, grams: i.grams, quantity: i.grams, unit: "g", preparation_note: i.note, position })),
  );
  if (iErr) {
    await supabase.from("recipes").delete().eq("id", data.id);
    throw iErr;
  }
  return data.id;
}
