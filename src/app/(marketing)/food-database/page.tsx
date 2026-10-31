import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Food Database: Calories and Nutrition per 100 g",
  description:
    "Search calories, protein, carbohydrates, fat, fibre and sodium per 100 g for common foods, with values from USDA FoodData Central.",
  alternates: { canonical: "/food-database" },
};

export default function FoodDatabasePage({ searchParams }: PageProps<"/food-database">) {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-6 max-w-3xl">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Food database</h1>
        <p className="text-lg text-muted">
          Nutrition per 100 g of edible food, taken directly from{" "}
          <a href="https://fdc.nal.usda.gov/" className="underline" rel="noopener">
            USDA FoodData Central
          </a>
          . These are the same values we use to calculate our recipes and meal plans.
        </p>
      </header>
      <form role="search" className="mb-6 flex max-w-xl gap-2">
        <label className="sr-only" htmlFor="food-q">
          Search foods
        </label>
        <Suspense fallback={<input id="food-q" className="input" name="q" placeholder="e.g. lentils, salmon, plantain" />}>
          <SearchInput searchParams={searchParams} />
        </Suspense>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
      <p className="mt-8 max-w-3xl text-sm text-muted">
        Source: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central (SR Legacy), public domain. Values
        are averages and vary with variety, brand and preparation.
      </p>
    </div>
  );
}

async function query(searchParams: PageProps<"/food-database">["searchParams"]) {
  const sp = await searchParams;
  return typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
}

async function SearchInput({ searchParams }: { searchParams: PageProps<"/food-database">["searchParams"] }) {
  const q = await query(searchParams);
  return <input id="food-q" className="input" name="q" defaultValue={q} placeholder="e.g. lentils, salmon, plantain" />;
}

async function Results({ searchParams }: { searchParams: PageProps<"/food-database">["searchParams"] }) {
  const q = await query(searchParams);
  const supabase = await createClient();
  let req = supabase
    .from("food_items")
    .select("id, name, display_name, category, fdc_id, kcal, protein_g, carbs_g, fat_g, fibre_g, sodium_mg, source_name")
    .order("display_name")
    .limit(60);
  if (q) {
    const safe = q.replace(/[%_,()]/g, " ");
    req = req.or(`name.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }
  const { data: foods } = await req;

  if (!foods?.length) {
    return <p className="card text-muted">{q ? `No foods match “${q}”.` : "The food database hasn't been loaded yet."}</p>;
  }
  const n = (v: number | null, digits = 1) => (v === null ? "–" : Number(v).toFixed(digits));
  return (
    <div className="card overflow-x-auto" tabIndex={0} role="region" aria-label="Nutrition table (scrolls sideways)">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Nutrition per 100 g</caption>
        <thead className="text-muted">
          <tr>
            <th className="py-2 pr-3 font-medium">Food</th>
            <th className="py-2 pr-3 text-right font-medium">kcal</th>
            <th className="py-2 pr-3 text-right font-medium">Protein (g)</th>
            <th className="py-2 pr-3 text-right font-medium">Carbs (g)</th>
            <th className="py-2 pr-3 text-right font-medium">Fat (g)</th>
            <th className="py-2 pr-3 text-right font-medium">Fibre (g)</th>
            <th className="py-2 text-right font-medium">Sodium (mg)</th>
          </tr>
        </thead>
        <tbody>
          {foods.map((f) => (
            <tr key={f.id} className="border-t border-border">
              <td className="py-2 pr-3">
                <span className="font-medium">{f.display_name ?? f.name}</span>
                {f.fdc_id && (
                  <a href={`https://fdc.nal.usda.gov/food-details/${f.fdc_id}/nutrients`} className="block text-xs text-muted underline" rel="noopener">
                    {f.name} (FDC {f.fdc_id})
                  </a>
                )}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{n(f.kcal, 0)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{n(f.protein_g)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{n(f.carbs_g)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{n(f.fat_g)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{n(f.fibre_g)}</td>
              <td className="py-2 text-right tabular-nums">{n(f.sodium_mg, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
