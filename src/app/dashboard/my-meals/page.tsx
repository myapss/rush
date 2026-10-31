import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GeneratePlanButton, SwapMealButton } from "@/components/plan-buttons";
import { requireUser } from "@/lib/auth";
import { getPlan, listRecentPlans, sumNutrition } from "@/lib/data/plans";

export const metadata: Metadata = { title: "My meals" };

const MEAL_LABEL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" } as const;
const fmt = (n: number) => Math.round(n).toLocaleString("en");

export default function MyMealsPage({ searchParams }: PageProps<"/dashboard/my-meals">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading your plan…</p>}>
      <MyMeals searchParams={searchParams} />
    </Suspense>
  );
}

async function MyMeals({ searchParams }: { searchParams: PageProps<"/dashboard/my-meals">["searchParams"] }) {
  const user = await requireUser("/dashboard/my-meals");
  const sp = await searchParams;
  const planId = typeof sp.plan === "string" && /^[0-9a-f-]{36}$/.test(sp.plan) ? sp.plan : undefined;
  const [plan, recent] = await Promise.all([getPlan(user.id, planId), listRecentPlans(user.id)]);

  if (!plan) {
    return (
      <div className="grid max-w-2xl gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">My meals</h1>
        <div className="card grid gap-3">
          <p className="text-muted">
            You don&apos;t have a meal plan yet. We&apos;ll build a 7-day plan from recipes that match your eating style, allergies
            and favourite cuisines, sized to your daily targets.
          </p>
          <GeneratePlanButton />
        </div>
      </div>
    );
  }

  const target = plan.target_kcal ?? 0;
  const summary = (plan.targets_snapshot as { summary?: string }).summary;
  const editable = plan.status === "active";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{plan.title}</h1>
          <p className="text-muted">
            Daily target about {fmt(target)} kcal · {plan.generator === "ai" ? "Planned with AI" : "Planned automatically"}
            {!editable && " · Past plan"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/grocery-list" className="btn">
            Shopping list
          </Link>
          <GeneratePlanButton label="New plan" />
        </div>
      </div>
      {summary && (
        <p className="card text-sm">
          <span className="mr-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">AI summary</span>
          {summary}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...plan.days].map(([date, meals]) => {
          const total = sumNutrition(meals);
          const off = target ? Math.round(((total.kcal - target) / target) * 100) : 0;
          return (
            <section key={date} className="card grid content-start gap-3" aria-label={new Date(date).toDateString()}>
              <h2 className="font-bold">
                {new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short" })}
              </h2>
              <ul className="grid gap-2">
                {meals.map((m) => (
                  <li key={m.id} className="rounded-xl border border-border bg-bg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-brand">{MEAL_LABEL[m.meal_type]}</span>
                      {editable && <SwapMealButton plannedMealId={m.id} title={m.recipe_title} />}
                    </div>
                    {m.recipe_id ? (
                      <Link href={`/dashboard/recipes/${m.recipe_id}?servings=${m.servings}`} className="font-semibold hover:underline">
                        {m.recipe_title}
                      </Link>
                    ) : (
                      <span className="font-semibold">{m.recipe_title}</span>
                    )}
                    <p className="text-sm text-muted">
                      {Number(m.servings)} serving{Number(m.servings) === 1 ? "" : "s"} · {fmt(m.nutrition_snapshot.kcal ?? 0)} kcal ·{" "}
                      {fmt(m.nutrition_snapshot.protein_g ?? 0)} g protein
                    </p>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border pt-2 text-sm text-muted">
                <strong className="text-fg">{fmt(total.kcal)} kcal</strong> ({off >= 0 ? "+" : ""}
                {off}%) · P {fmt(total.protein)} g · C {fmt(total.carbs)} g · F {fmt(total.fat)} g
              </p>
            </section>
          );
        })}
      </div>

      <p className="text-sm text-muted">
        Nutrition is estimated from USDA FoodData Central values for each ingredient. Actual values vary with brands, portion
        sizes and cooking. Always check labels if you have allergies.
      </p>

      {recent.length > 1 && (
        <section aria-labelledby="recent-h" className="card">
          <h2 id="recent-h" className="mb-2 font-bold">
            Recent plans
          </h2>
          <ul className="grid gap-1 text-sm">
            {recent.map((p) => (
              <li key={p.id}>
                <Link href={p.status === "active" ? "/dashboard/my-meals" : `/dashboard/my-meals?plan=${p.id}`} className="hover:underline">
                  {p.title}
                </Link>{" "}
                <span className="text-muted">{p.status === "active" ? "(current)" : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
