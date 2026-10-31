import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { deleteOwnRecipe } from "@/lib/actions/recipe-generator";
import { toggleSavedRecipe } from "@/lib/actions/recipes";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { getRecipe } from "@/lib/data/recipes";
import { formatGrams } from "@/lib/grocery/build";
import { ALLERGENS } from "@/lib/reference";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Recipe" };

export default function RecipePage({ params, searchParams }: PageProps<"/dashboard/recipes/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading recipe…</p>}>
      <Recipe params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const allergenLabel = (a: string) => ALLERGENS.find((x) => x.value === a)?.label ?? a;

async function Recipe({ params, searchParams }: Pick<PageProps<"/dashboard/recipes/[id]">, "params" | "searchParams">) {
  const user = await requireUser("/dashboard/recipes");
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const requested = Number(sp.servings);
  const servings = Number.isFinite(requested) && requested >= 0.25 && requested <= 12 ? requested : recipe.servings;
  const factor = servings / recipe.servings;

  const supabase = await createClient();
  const [{ profile, preferences }, { data: saved }] = await Promise.all([
    getProfileAndPreferences(user.id),
    supabase.from("saved_recipes").select("recipe_id").eq("user_id", user.id).eq("recipe_id", id).maybeSingle(),
  ]);
  const n = recipe.nutrition_per_serving as { kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number };
  const conflicts = recipe.allergen_tags.filter((a) => preferences?.allergies.includes(a));
  const ingredients = [...recipe.recipe_ingredients].sort((a, b) => a.position - b.position);

  return (
    <article className="grid max-w-3xl gap-6">
      <div>
        <Link href="/dashboard/recipes" className="text-sm text-muted hover:underline print:hidden">
          ← All recipes
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{recipe.title}</h1>
        <p className="text-muted">{recipe.description}</p>
        <p className="mt-2 text-sm text-muted">
          {recipe.cuisine} · Prep {recipe.prep_minutes} min · Cook {recipe.cook_minutes} min · Recipe makes {recipe.servings} serving
          {recipe.servings === 1 ? "" : "s"}
        </p>
      </div>

      {recipe.origin === "ai_generated" && (
        <p className="notice text-sm">
          <strong>AI-generated recipe.</strong> Nutrition is calculated from USDA data, and every ingredient was checked against
          your allergies and preferences, but the method hasn&apos;t been reviewed by a person. Use your judgement, and always cook
          meat, fish and eggs thoroughly.
        </p>
      )}

      {conflicts.length > 0 && (
        <p className="notice" role="alert">
          <strong>Allergy warning:</strong> this recipe contains {conflicts.map(allergenLabel).join(", ")}, which you&apos;ve told
          us to avoid.
        </p>
      )}

      <div className="flex flex-wrap gap-2 print:hidden">
        <form action={toggleSavedRecipe}>
          <input type="hidden" name="recipeId" value={recipe.id} />
          <input type="hidden" name="saved" value={saved ? "true" : "false"} />
          <button type="submit" className="btn">
            {saved ? "★ Saved" : "☆ Save recipe"}
          </button>
        </form>
        <PrintButton />
        {recipe.created_by === user.id && (
          <form action={deleteOwnRecipe}>
            <input type="hidden" name="recipeId" value={recipe.id} />
            <button type="submit" className="btn btn-danger">
              Delete recipe
            </button>
          </form>
        )}
      </div>

      <section aria-labelledby="nutrition-h" className="card">
        <h2 id="nutrition-h" className="mb-2 font-bold">
          Nutrition per serving (estimate)
        </h2>
        <dl className="grid grid-cols-4 gap-2 text-center">
          {[
            ["Calories", `${Math.round(n.kcal ?? 0)}`],
            ["Protein", `${Math.round(n.protein_g ?? 0)} g`],
            ["Carbs", `${Math.round(n.carbs_g ?? 0)} g`],
            ["Fat", `${Math.round(n.fat_g ?? 0)} g`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-surface-2 p-2">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="text-lg font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">
          Calculated from USDA FoodData Central (SR Legacy) values for each ingredient.
          {recipe.allergen_tags.length > 0 && ` Contains: ${recipe.allergen_tags.map(allergenLabel).join(", ")}.`}
          {recipe.review_status === "unreviewed" && recipe.origin === "curated" && " This recipe hasn't been reviewed by a dietitian yet."}
        </p>
      </section>

      <section aria-labelledby="ingredients-h" className="card">
        <h2 id="ingredients-h" className="mb-2 font-bold">
          Ingredients {factor !== 1 && <span className="font-normal text-muted">(for {servings} servings)</span>}
        </h2>
        <ul className="grid gap-1.5">
          {ingredients.map((ri, i) => {
            const f = ri.food_items;
            const household = ri.unit !== "g" ? `${+(Number(ri.quantity) * factor).toFixed(2)} ${ri.unit} · ` : "";
            return (
              <li key={i} className="flex justify-between gap-4 border-b border-border pb-1.5 last:border-0">
                <span>
                  {f?.display_name ?? f?.name}
                  {ri.preparation_note && <span className="text-muted">, {ri.preparation_note}</span>}
                </span>
                <span className="whitespace-nowrap text-sm text-muted tabular-nums">
                  {household}
                  {formatGrams(Number(ri.grams) * factor, profile.measurement_unit)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="steps-h" className="card">
        <h2 id="steps-h" className="mb-2 font-bold">
          Method
        </h2>
        <ol className="grid list-decimal gap-2 pl-5">
          {recipe.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">Cook meat, fish and eggs thoroughly. Always check product labels for allergens.</p>
      </section>

      {(recipe.substitutions as { instead_of: string; use: string; tip: string }[]).length > 0 && (
        <section aria-labelledby="subs-h" className="card">
          <h2 id="subs-h" className="mb-2 font-bold">
            Substitutions
          </h2>
          <ul className="grid gap-1.5 text-sm">
            {(recipe.substitutions as { instead_of: string; use: string; tip: string }[]).map((s, i) => (
              <li key={i}>
                <strong>{s.use}</strong> instead of {s.instead_of}
                {s.tip && <span className="text-muted">: {s.tip}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
