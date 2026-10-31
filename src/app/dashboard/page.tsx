import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GeneratePlanButton } from "@/components/plan-buttons";
import { requireUser } from "@/lib/auth";
import { getPlan, sumNutrition } from "@/lib/data/plans";
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
  const [{ data: quota }, plan] = await Promise.all([
    supabase.rpc("quota_status", { p_feature: "meal_plan" }).maybeSingle(),
    getPlan(user.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todays = plan?.days.get(today) ?? [];
  const todayTotals = sumNutrition(todays);

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
        <section aria-labelledby="plan-h" className="card grid content-start gap-3">
          <h2 id="plan-h" className="text-lg font-bold">
            Today&apos;s meals
          </h2>
          {todays.length > 0 ? (
            <>
              <ul className="grid gap-1.5">
                {todays.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 text-sm">
                    <span>
                      <span className="mr-2 text-xs font-bold uppercase text-brand">{m.meal_type}</span>
                      {m.recipe_id ? (
                        <Link href={`/dashboard/recipes/${m.recipe_id}?servings=${m.servings}`} className="hover:underline">
                          {m.recipe_title}
                        </Link>
                      ) : (
                        m.recipe_title
                      )}
                    </span>
                    <span className="whitespace-nowrap text-muted">{Math.round(m.nutrition_snapshot.kcal ?? 0)} kcal</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border pt-2 text-sm text-muted">
                Today: <strong className="text-fg">{Math.round(todayTotals.kcal).toLocaleString("en")} kcal</strong> · P{" "}
                {Math.round(todayTotals.protein)} g · C {Math.round(todayTotals.carbs)} g · F {Math.round(todayTotals.fat)} g
              </p>
              <Link href="/dashboard/my-meals" className="btn w-fit">
                See the whole week
              </Link>
            </>
          ) : plan ? (
            <p className="text-muted">
              Your current plan doesn&apos;t cover today.{" "}
              <Link href="/dashboard/my-meals" className="font-semibold text-brand underline">
                Create a new plan
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="text-muted">Get a 7-day plan built around your preferences and targets.</p>
              <GeneratePlanButton />
            </>
          )}
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
