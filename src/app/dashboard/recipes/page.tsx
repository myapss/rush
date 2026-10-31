import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { loadCandidates } from "@/lib/planner/candidates";
import { plannerPrefs } from "@/lib/planner/prefs";
import { isAllowed } from "@/lib/planner/rules";
import type { Candidate } from "@/lib/planner/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Recipes" };

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function RecipesPage({ searchParams }: PageProps<"/dashboard/recipes">) {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Recipes</h1>
      <Suspense fallback={<p className="text-muted">Loading recipes…</p>}>
        <Recipes searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** Score recipes by how many of the user's ingredients they use. */
function pantryMatches(c: Candidate, have: string[]): number {
  return have.filter((h) => c.ingredients.some((i) => i.terms.some((t) => t.includes(h)))).length;
}

async function Recipes({ searchParams }: { searchParams: PageProps<"/dashboard/recipes">["searchParams"] }) {
  const user = await requireUser("/dashboard/recipes");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80).toLowerCase() : "";
  const have = typeof sp.have === "string" ? sp.have.toLowerCase().split(",").map((s) => s.trim()).filter((s) => s.length >= 2).slice(0, 15) : [];
  const type = MEAL_TYPES.find((t) => t === sp.type);
  const showSaved = sp.saved === "1";

  const supabase = await createClient();
  const { preferences } = await getProfileAndPreferences(user.id);
  const prefs = preferences ? plannerPrefs(preferences) : null;
  const [all, { data: saved }] = await Promise.all([
    prefs ? loadCandidates(supabase, { ...prefs, dislikes: [], maxCookMinutes: null }) : Promise.resolve([] as Candidate[]),
    supabase.from("saved_recipes").select("recipe_id").eq("user_id", user.id),
  ]);
  const savedIds = new Set((saved ?? []).map((s) => s.recipe_id));

  let list = all.filter((c) => c.kcal > 0 && (!prefs || isAllowed(c, { ...prefs, dislikes: [], maxCookMinutes: null })));
  if (type) list = list.filter((c) => c.mealTypes.includes(type));
  if (q) list = list.filter((c) => c.title.toLowerCase().includes(q) || (c.cuisine ?? "").toLowerCase().includes(q));
  if (showSaved) list = list.filter((c) => savedIds.has(c.id));
  const ranked = have.length
    ? list.map((c) => ({ c, n: pantryMatches(c, have) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || a.c.title.localeCompare(b.c.title))
    : list.map((c) => ({ c, n: 0 })).sort((a, b) => a.c.title.localeCompare(b.c.title));

  return (
    <>
      <form className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_auto] lg:items-end" role="search">
        <label className="label">
          Search
          <input className="input" name="q" defaultValue={q} placeholder="Dish or cuisine" />
        </label>
        <label className="label">
          Ingredients I have
          <input className="input" name="have" defaultValue={have.join(", ")} placeholder="e.g. rice, beans, spinach" />
        </label>
        <label className="label">
          Meal
          <select className="input" name="type" defaultValue={type ?? ""}>
            <option value="">Any</option>
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="saved" value="1" defaultChecked={showSaved} /> Saved
          </label>
          <button type="submit" className="btn btn-primary">
            Find
          </button>
        </div>
      </form>
      <p className="text-sm text-muted">
        Showing recipes that fit your eating style, allergies and restrictions. {ranked.length} found.
      </p>
      {ranked.length === 0 ? (
        <p className="card text-muted">
          {all.length === 0
            ? "The recipe library hasn't been loaded yet."
            : "No recipes match. Try fewer ingredients or a different search."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map(({ c, n }) => (
            <li key={c.id} className="card grid gap-1">
              <Link href={`/dashboard/recipes/${c.id}`} className="font-semibold hover:underline">
                {c.title}
              </Link>
              <p className="text-sm text-muted">
                {c.cuisine} · {c.totalMinutes} min · {Math.round(c.kcal)} kcal & {Math.round(c.protein)} g protein per serving
              </p>
              {have.length > 0 && <p className="text-sm text-brand">Uses {n} of your ingredients</p>}
              {savedIds.has(c.id) && <p className="text-xs font-semibold text-muted">★ Saved</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
