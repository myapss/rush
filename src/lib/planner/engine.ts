import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { buildGroceryLines, type RecipeForGrocery } from "@/lib/grocery/build";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { AiPlanError, aiConfigured, aiPickRecipes, type AiUsage } from "./ai";
import { loadCandidates, loadRecipesById } from "./candidates";
import { mealNutrition } from "./nutrition";
import { buildPools, insufficientPools, preferenceScore, rulesPlan, validatePlan, withServings } from "./plan";
import { planTargets, plannerPrefs } from "./prefs";
import { rejectReason } from "./rules";
import { buildSlots, servingsFor, slotTargets } from "./slots";
import type { Candidate, PlanDraft } from "./types";

type Client = SupabaseClient<Database>;

export type PlanResult =
  | { ok: true; planId: string; generator: "ai" | "rules" }
  | { ok: false; reason: "quota" | "no_body_data" | "not_applicable" | "insufficient" | "not_found" | "error"; message: string };

const MAX_AI_ATTEMPTS = 2;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function finishEvent(eventId: number, status: Database["public"]["Enums"]["ai_event_status"], usage: AiUsage[]) {
  const total = usage.reduce(
    (a, u) => ({
      input: a.input + u.inputTokens,
      output: a.output + u.outputTokens,
      cost: a.cost + (u.costUsd ?? 0),
      latency: a.latency + u.latencyMs,
    }),
    { input: 0, output: 0, cost: 0, latency: 0 },
  );
  const { error } = await createAdminClient()
    .from("ai_events")
    .update({
      status,
      model: usage[0]?.model ?? null,
      input_tokens: usage.length ? total.input : null,
      output_tokens: usage.length ? total.output : null,
      cost_usd_est: usage.length ? Number(total.cost.toFixed(6)) : null,
      latency_ms: usage.length ? total.latency : null,
    })
    .eq("id", eventId);
  if (error) console.error("could not update ai_event", eventId, error.message);
}

/** Generate, validate and save a new 7-day plan for the signed-in user. */
export async function generateMealPlan(userId: string): Promise<PlanResult> {
  const supabase = await createClient();
  const { profile, preferences } = await getProfileAndPreferences(userId);
  if (!preferences) return { ok: false, reason: "error", message: "Please finish setting up your profile first." };

  const t = planTargets(profile, preferences, new Date().getUTCFullYear());
  if (!t.ok) return { ok: false, reason: t.reason, message: t.message };

  const prefs = plannerPrefs(preferences);
  const slots = buildSlots(prefs.mealsPerDay, prefs.includeSnacks);
  const candidates = await loadCandidates(supabase, prefs);
  const pools = buildPools(candidates, prefs, slots);
  const short = insufficientPools(pools);
  if (short.length) {
    return {
      ok: false,
      reason: "insufficient",
      message: `There aren't enough ${short.join(" and ")} recipes that match your preferences and restrictions yet. Try loosening dislikes or the cooking-time limit; we're adding recipes regularly.`,
    };
  }

  const { data: eventId, error: quotaError } = await supabase.rpc("consume_quota", { p_feature: "meal_plan" });
  if (quotaError) return { ok: false, reason: "error", message: "We couldn't check your plan allowance. Please try again." };
  if (eventId === null) return { ok: false, reason: "quota", message: "You've used all your meal plans for this month." };

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const usage: AiUsage[] = [];
  let draft: PlanDraft | null = null;
  let generator: "ai" | "rules" = "rules";
  let summary: string | null = null;

  try {
    if (aiConfigured()) {
      let feedback: string[] | undefined;
      for (let attempt = 0; attempt < MAX_AI_ATTEMPTS && !draft; attempt++) {
        try {
          const picks = await aiPickRecipes({ pools, slots, prefs, targets: t.targets, feedback });
          usage.push(picks.usage);
          if (picks.days.length !== 7 || picks.days.some((d) => d.some((m) => !byId.has(m.recipeId)))) {
            feedback = ["Return exactly 7 days and use only the listed candidate codes."];
            continue;
          }
          const candidate = withServings(picks.days, slots, byId, t.targets);
          const v = validatePlan(candidate, slots, byId, prefs, t.targets, pools);
          if (!v.hard.length && !v.soft.length) {
            draft = candidate;
            generator = "ai";
            summary = picks.summary;
          } else {
            feedback = [...v.hard, ...v.soft].slice(0, 10);
          }
        } catch (e) {
          if (e instanceof AiPlanError) {
            if (e.usage) usage.push(e.usage);
            console.warn("AI planner attempt failed:", e.kind, e.message);
            if (e.kind === "api") break;
          } else throw e;
        }
      }
    }

    if (!draft) {
      draft = rulesPlan(pools, prefs, slots, t.targets, Date.now() % 1_000_000_007);
      const v = validatePlan(draft, slots, byId, prefs, t.targets, pools);
      // The rules planner only uses allowed recipes; a hard failure here is a bug.
      if (v.hard.length) throw new Error(`Rules planner produced an invalid plan: ${v.hard.join("; ")}`);
    }

    const planId = await savePlan(supabase, userId, draft, byId, t.targets.kcal, t.snapshot, generator, eventId, summary, preferences.goal);
    await finishEvent(eventId, generator === "ai" ? "ok" : "fallback", usage);
    return { ok: true, planId, generator };
  } catch (e) {
    // Errors don't count against the user's quota.
    await finishEvent(eventId, "error", usage);
    console.error("meal plan generation failed", e);
    return { ok: false, reason: "error", message: "Something went wrong while creating your plan. You haven't been charged a plan; please try again." };
  }
}

async function savePlan(
  supabase: Client,
  userId: string,
  draft: PlanDraft,
  byId: Map<string, Candidate>,
  targetKcal: number,
  targetsSnapshot: Record<string, unknown>,
  generator: "ai" | "rules",
  eventId: number,
  summary: string | null,
  goal: Database["public"]["Enums"]["goal"],
): Promise<string> {
  const start = new Date();
  const end = new Date(start.getTime() + 6 * 86_400_000);

  const { error: archiveError } = await supabase
    .from("meal_plans")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "active");
  if (archiveError) throw archiveError;

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .insert({
      user_id: userId,
      title: `Week of ${start.toLocaleDateString("en", { day: "numeric", month: "long" })}`,
      goal,
      target_kcal: targetKcal,
      start_date: isoDate(start),
      end_date: isoDate(end),
      status: "active",
      generator,
      ai_event_id: eventId,
      targets_snapshot: { ...targetsSnapshot, ...(summary ? { summary } : {}) },
    })
    .select("id")
    .single();
  if (error) throw error;

  const rows = draft.days.flatMap((day, d) =>
    day.map((m) => {
      const c = byId.get(m.recipeId)!;
      const n = mealNutrition(c, m.servings);
      return {
        meal_plan_id: plan.id,
        date: isoDate(new Date(start.getTime() + d * 86_400_000)),
        slot: m.slot,
        meal_type: m.mealType,
        recipe_id: c.id,
        recipe_title: c.title,
        servings: m.servings,
        position: m.slot,
        nutrition_snapshot: { kcal: n.kcal, protein_g: n.protein, carbs_g: n.carbs, fat_g: n.fat },
      };
    }),
  );
  const { error: mealsError } = await supabase.from("planned_meals").insert(rows);
  if (mealsError) throw mealsError;

  await rebuildGroceryList(supabase, userId, plan.id);
  return plan.id;
}

/** Create or refresh the plan's grocery list, keeping manual items and ticks. */
export async function rebuildGroceryList(supabase: Client, userId: string, planId: string) {
  const { data: meals, error } = await supabase.from("planned_meals").select("recipe_id, servings").eq("meal_plan_id", planId);
  if (error) throw error;
  const recipes = await loadRecipesById(supabase, [...new Set(meals.flatMap((m) => (m.recipe_id ? [m.recipe_id] : [])))]);
  const forGrocery = new Map<string, RecipeForGrocery>(
    [...recipes].map(([id, r]) => [
      id,
      { servings: r.servings, ingredients: r.ingredients.map((i) => ({ foodItemId: i.foodItemId, name: i.name, category: i.category, grams: i.grams })) },
    ]),
  );
  const lines = buildGroceryLines(
    meals.flatMap((m) => (m.recipe_id ? [{ recipeId: m.recipe_id, servings: Number(m.servings) }] : [])),
    forGrocery,
  );

  let { data: list } = await supabase.from("grocery_lists").select("id").eq("meal_plan_id", planId).maybeSingle();
  if (!list) {
    const { data: created, error: createError } = await supabase
      .from("grocery_lists")
      .insert({ user_id: userId, meal_plan_id: planId, title: "Shopping list" })
      .select("id")
      .single();
    if (createError) throw createError;
    list = created;
  }

  const { data: existing } = await supabase.from("grocery_items").select("food_item_id, checked").eq("grocery_list_id", list.id).eq("source", "plan");
  const checked = new Set((existing ?? []).filter((e) => e.checked && e.food_item_id).map((e) => e.food_item_id));

  const { error: delError } = await supabase.from("grocery_items").delete().eq("grocery_list_id", list.id).eq("source", "plan");
  if (delError) throw delError;
  if (lines.length) {
    const { error: insError } = await supabase.from("grocery_items").insert(
      lines.map((l, position) => ({
        grocery_list_id: list.id,
        food_item_id: l.foodItemId,
        name: l.name,
        quantity: l.grams,
        unit: "g",
        category: l.category,
        checked: checked.has(l.foodItemId),
        source: "plan",
        position,
      })),
    );
    if (insError) throw insError;
  }
}

/** Replace one planned meal with the best alternative that respects all rules. */
export async function swapPlannedMeal(userId: string, plannedMealId: string): Promise<PlanResult> {
  const supabase = await createClient();
  const { data: meal } = await supabase
    .from("planned_meals")
    .select("id, meal_plan_id, date, slot, meal_type, recipe_id, servings, nutrition_snapshot")
    .eq("id", plannedMealId)
    .maybeSingle();
  if (!meal) return { ok: false, reason: "not_found", message: "That meal wasn't found." };

  const { profile, preferences } = await getProfileAndPreferences(userId);
  if (!preferences) return { ok: false, reason: "error", message: "Please finish setting up your profile first." };
  const t = planTargets(profile, preferences, new Date().getUTCFullYear());
  if (!t.ok) return { ok: false, reason: t.reason, message: t.message };
  const prefs = plannerPrefs(preferences);

  const { data: sameDay } = await supabase.from("planned_meals").select("recipe_id").eq("meal_plan_id", meal.meal_plan_id).eq("date", meal.date);
  const exclude = new Set((sameDay ?? []).map((m) => m.recipe_id));
  const options = (await loadCandidates(supabase, prefs)).filter((c) => !exclude.has(c.id) && rejectReason(c, prefs, meal.meal_type) === null);
  if (!options.length) return { ok: false, reason: "insufficient", message: "There are no other recipes that fit this slot and your preferences." };

  const { data: eventId, error: quotaError } = await supabase.rpc("consume_quota", { p_feature: "substitution" });
  if (quotaError) return { ok: false, reason: "error", message: "We couldn't check your swap allowance. Please try again." };
  if (eventId === null) return { ok: false, reason: "quota", message: "You've used all your meal swaps for this month." };

  try {
    const slots = buildSlots(prefs.mealsPerDay, prefs.includeSnacks);
    const slotKcal = slotTargets(t.targets.kcal, slots)[meal.slot] ?? Number((meal.nutrition_snapshot as { kcal?: number }).kcal ?? 400);
    // Pick among the best few by preference so repeated swaps offer variety.
    const ranked = options.map((c) => ({ c, score: preferenceScore(c, prefs) + Math.random() * 1.5 })).sort((a, b) => b.score - a.score);
    const pick = ranked[0].c;
    const servings = servingsFor(pick.kcal, slotKcal);
    const n = mealNutrition(pick, servings);

    const { error } = await supabase
      .from("planned_meals")
      .update({ recipe_id: pick.id, recipe_title: pick.title, servings, nutrition_snapshot: { kcal: n.kcal, protein_g: n.protein, carbs_g: n.carbs, fat_g: n.fat } })
      .eq("id", meal.id);
    if (error) throw error;
    await rebuildGroceryList(supabase, userId, meal.meal_plan_id);
    await finishEvent(eventId, "ok", []);
    return { ok: true, planId: meal.meal_plan_id, generator: "rules" };
  } catch (e) {
    await finishEvent(eventId, "error", []);
    console.error("swap failed", e);
    return { ok: false, reason: "error", message: "We couldn't swap that meal. Please try again." };
  }
}
