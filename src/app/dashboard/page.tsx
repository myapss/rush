import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { NOT_APPLICABLE_MESSAGE, NOTE_MESSAGE } from "@/lib/nutrition/messages";
import { computeTargets } from "@/lib/nutrition/targets";
import type { HealthFlags } from "@/lib/nutrition/types";
import { ALLERGENS, DIETARY_PATTERNS, GOAL_OPTIONS } from "@/lib/reference";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your dashboard…</p>}>
      <Overview />
    </Suspense>
  );
}

const label = <T extends string>(list: { value: T; label: string }[], v: string) => list.find((o) => o.value === v)?.label ?? v;

async function Overview() {
  const user = await requireUser("/dashboard");
  const { profile, preferences } = await getProfileAndPreferences(user.id);
  if (!profile.onboarding_completed_at || !preferences) redirect("/onboarding");

  const supabase = await createClient();
  const { data: quota } = await supabase.rpc("quota_status", { p_feature: "meal_plan" }).maybeSingle();

  const age = profile.birth_year ? new Date().getUTCFullYear() - profile.birth_year : null;
  const targets =
    age !== null && profile.height_cm && profile.weight_kg && profile.sex_for_calc
      ? computeTargets({
          age,
          sex: profile.sex_for_calc,
          heightCm: profile.height_cm,
          weightKg: profile.weight_kg,
          activity: preferences.activity_level,
          goal: preferences.goal,
          flags: profile.health_flags as HealthFlags,
        })
      : null;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {profile.display_name ? `Hi, ${profile.display_name}` : "Your dashboard"}
        </h1>
        <p className="text-muted">Signed in as {user.email}</p>
      </div>

      <section aria-labelledby="targets-h" className="card">
        <h2 id="targets-h" className="mb-3 text-lg font-bold">
          Daily targets
        </h2>
        {!targets && (
          <p className="text-muted">
            Add your height and weight (with consent) in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-brand underline">
              Settings
            </Link>{" "}
            to see calorie and macro estimates.
          </p>
        )}
        {targets?.status === "not_applicable" && <p className="notice">{NOT_APPLICABLE_MESSAGE[targets.reason]}</p>}
        {targets?.status === "ok" && (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Calories", `${targets.calories.target.toLocaleString("en")} kcal`, `${targets.calories.range.min.toLocaleString("en")}–${targets.calories.range.max.toLocaleString("en")}`],
                ["Protein", `${targets.protein.grams} g`, `${targets.protein.range.min}–${targets.protein.range.max} g`],
                ["Carbs", `${targets.carbs.grams} g`, `${targets.carbs.range.min}–${targets.carbs.range.max} g`],
                ["Fat", `${targets.fat.grams} g`, `${targets.fat.range.min}–${targets.fat.range.max} g`],
              ].map(([k, v, r]) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="text-2xl font-extrabold tabular-nums">{v}</dd>
                  <dd className="text-xs text-muted">range {r}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 space-y-1 text-sm text-muted">
              {targets.notes.map((n) => NOTE_MESSAGE[n] && <p key={n}>{NOTE_MESSAGE[n]}</p>)}
              <p>
                Estimates only (Mifflin-St Jeor, TDEE {targets.tdee.toLocaleString("en")} kcal).{" "}
                <Link href="/nutrition-disclaimer" className="underline">
                  Disclaimer
                </Link>
              </p>
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="plan-h" className="card">
          <h2 id="plan-h" className="mb-2 text-lg font-bold">
            Meal plans
          </h2>
          <p className="mb-3 text-muted">
            The AI meal planner is being built. Your preferences are saved, so your first plan will use them automatically.
          </p>
          {quota && (
            <p className="text-sm text-muted">
              {quota.tier === "premium" ? "Premium" : "Free"} plan: {quota.used} of {quota.monthly_limit} meal plans used this
              month. Resets {new Date(quota.resets_at).toLocaleDateString("en", { day: "numeric", month: "long" })}.
            </p>
          )}
        </section>

        <section aria-labelledby="prefs-h" className="card">
          <h2 id="prefs-h" className="mb-2 text-lg font-bold">
            Your preferences
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Goal</dt>
            <dd>{label(GOAL_OPTIONS, preferences.goal)}</dd>
            <dt className="text-muted">Eating style</dt>
            <dd>{label(DIETARY_PATTERNS, preferences.dietary_pattern)}</dd>
            <dt className="text-muted">Allergies</dt>
            <dd>{preferences.allergies.length ? preferences.allergies.map((a) => label(ALLERGENS, a)).join(", ") : "None"}</dd>
            <dt className="text-muted">Cuisines</dt>
            <dd>{preferences.preferred_cuisines.length ? preferences.preferred_cuisines.join(", ") : "Any"}</dd>
          </dl>
          <Link href="/dashboard/settings" className="btn mt-4">
            Edit preferences
          </Link>
        </section>
      </div>
    </div>
  );
}
