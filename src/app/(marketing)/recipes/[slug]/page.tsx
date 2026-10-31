import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbs, JsonLd } from "@/components/json-ld";
import { getPublicNutrition } from "@/lib/data/public-nutrition";
import { siteUrl } from "@/lib/env";
import { BY_SLUG, LIBRARY, PATTERN_LABEL } from "@/lib/library";
import { ALLERGENS } from "@/lib/reference";

export function generateStaticParams() {
  return LIBRARY.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const r = BY_SLUG.get((await params).slug);
  if (!r) return {};
  return { title: `${r.title} Recipe`, description: `${r.description} ${r.totalMinutes} minutes, ${PATTERN_LABEL[r.pattern].toLowerCase()}.`, alternates: { canonical: `/recipes/${r.slug}` } };
}

const allergenLabel = (a: string) => ALLERGENS.find((x) => x.value === a)?.label ?? a;
const MEAL = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" } as const;

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const r = BY_SLUG.get((await params).slug);
  if (!r) notFound();
  const nutrition = (await getPublicNutrition())[r.slug];
  const related = LIBRARY.filter((x) => x.slug !== r.slug && x.cuisine === r.cuisine).slice(0, 4);

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <JsonLd data={breadcrumbs(siteUrl, [["Recipes", "/recipes"], [r.title, `/recipes/${r.slug}`]])} />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <Link href="/recipes" className="hover:underline">
          Recipes
        </Link>{" "}
        › {r.cuisine}
      </nav>
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{r.title}</h1>
      <p className="mb-4 text-lg text-muted">{r.description}</p>
      <ul className="mb-6 flex flex-wrap gap-2 text-sm">
        {[r.cuisine, `Prep ${r.prep} min`, `Cook ${r.cook} min`, `Serves ${r.servings}`, PATTERN_LABEL[r.pattern], ...r.mealTypes.map((t) => MEAL[t])].map((t) => (
          <li key={t} className="rounded-full border border-border bg-surface px-3 py-1">
            {t}
          </li>
        ))}
      </ul>

      {r.allergens.length > 0 && (
        <p className="notice mb-6 text-sm">
          <strong>Contains:</strong> {r.allergens.map(allergenLabel).join(", ")}. Always check product labels.
        </p>
      )}

      <section aria-labelledby="n-h" className="card mb-6">
        <h2 id="n-h" className="mb-2 font-bold">
          Nutrition per serving
        </h2>
        {nutrition ? (
          <>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Calories", `${Math.round(nutrition.kcal)}`],
                ["Protein", `${Math.round(nutrition.protein_g)} g`],
                ["Carbs", `${Math.round(nutrition.carbs_g)} g`],
                ["Fat", `${Math.round(nutrition.fat_g)} g`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-2 p-2">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="text-lg font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted">Estimated from USDA FoodData Central values for each ingredient.</p>
          </>
        ) : (
          <p className="text-sm text-muted">Nutrition for this recipe is being calculated from USDA data and will appear here soon.</p>
        )}
      </section>

      <section aria-labelledby="i-h" className="card mb-6">
        <h2 id="i-h" className="mb-2 font-bold">
          Ingredients
        </h2>
        <ul className="grid gap-1.5">
          {r.foods.map(({ food, grams, qty, unit, note }, i) => (
            <li key={i} className="flex justify-between gap-4 border-b border-border pb-1.5 last:border-0">
              <span>
                {food.name}
                {note && <span className="text-muted">, {note}</span>}
              </span>
              <span className="whitespace-nowrap text-sm text-muted tabular-nums">
                {qty && unit ? `${qty} ${unit} · ` : ""}
                {grams} g
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="m-h" className="card mb-6">
        <h2 id="m-h" className="mb-2 font-bold">
          Method
        </h2>
        <ol className="grid list-decimal gap-2 pl-5">
          {r.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <div className="card mb-6 flex flex-col gap-3 bg-brand-soft sm:flex-row sm:items-center sm:justify-between">
        <p>Get this dish in a weekly plan, with portions sized for your goals and a shopping list.</p>
        <Link href="/signup" className="btn btn-primary shrink-0">
          Plan my week
        </Link>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="r-h">
          <h2 id="r-h" className="mb-2 font-bold">
            More {r.cuisine} recipes
          </h2>
          <ul className="grid gap-1">
            {related.map((x) => (
              <li key={x.slug}>
                <Link href={`/recipes/${x.slug}`} className="text-brand underline">
                  {x.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-8 text-xs text-muted">
        Recipe by the NutriPlan AI team; not yet reviewed by a registered dietitian. Cook meat, fish and eggs thoroughly.
      </p>
    </article>
  );
}
