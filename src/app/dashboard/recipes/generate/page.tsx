import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RecipeGeneratorForm } from "@/components/recipe-generator-form";
import { aiConfigured } from "@/lib/ai/client";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "AI recipe ideas" };

export default function GeneratePage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <Link href="/dashboard/recipes" className="text-sm text-muted hover:underline">
          ← Recipes
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">AI recipe ideas</h1>
        <p className="text-muted">
          Tell us what&apos;s in your kitchen and we&apos;ll suggest two recipes. They only use foods that suit your allergies and
          eating style, and nutrition is calculated from USDA data.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Generator />
      </Suspense>
    </div>
  );
}

async function Generator() {
  const user = await requireUser("/dashboard/recipes/generate");
  const supabase = await createClient();
  const [{ data: quota }, { data: mine }] = await Promise.all([
    supabase.rpc("quota_status", { p_feature: "recipe" }).maybeSingle(),
    supabase
      .from("recipes")
      .select("id, title, description, meal_types, prep_minutes, cook_minutes, nutrition_per_serving, created_at")
      .eq("created_by", user.id)
      .eq("origin", "ai_generated")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      {aiConfigured() ? (
        <>
          <RecipeGeneratorForm />
          {quota && (
            <p className="text-sm text-muted">
              {quota.used} of {quota.monthly_limit} AI recipe generations used this month.{" "}
              {quota.tier === "free" && (
                <Link href="/dashboard/billing" className="underline">
                  Get more with Premium
                </Link>
              )}
            </p>
          )}
        </>
      ) : (
        <p className="card text-muted">
          The AI recipe generator isn&apos;t switched on yet. Meanwhile, the{" "}
          <Link href="/dashboard/recipes" className="font-semibold text-brand underline">
            recipe finder
          </Link>{" "}
          can match recipes to the ingredients you have.
        </p>
      )}

      <section aria-labelledby="mine-h" className="grid gap-3">
        <h2 id="mine-h" className="text-lg font-bold">
          Your AI recipes
        </h2>
        {mine?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {mine.map((r) => {
              const n = r.nutrition_per_serving as { kcal?: number; protein_g?: number };
              return (
                <li key={r.id} className="card grid gap-1">
                  <Link href={`/dashboard/recipes/${r.id}`} className="font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-sm text-muted">{r.description}</p>
                  <p className="text-xs text-muted">
                    {r.meal_types[0]} · {r.prep_minutes + r.cook_minutes} min
                    {n.kcal ? ` · ${Math.round(n.kcal)} kcal & ${Math.round(n.protein_g ?? 0)} g protein per serving` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">Recipes you create will appear here.</p>
        )}
      </section>
    </>
  );
}
