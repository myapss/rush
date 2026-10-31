import type { Metadata } from "next";
import Link from "next/link";
import { LIBRARY, PATTERN_LABEL } from "@/lib/library";

export const metadata: Metadata = {
  title: "Healthy Recipes from Around the World",
  description:
    "Simple, balanced recipes from Nigerian, Indian, Mexican, Japanese, Mediterranean and other cuisines, with nutrition calculated from USDA data.",
  alternates: { canonical: "/recipes" },
};

export default function RecipesIndex() {
  const byCuisine = new Map<string, typeof LIBRARY>();
  for (const r of [...LIBRARY].sort((a, b) => a.title.localeCompare(b.title))) byCuisine.set(r.cuisine, [...(byCuisine.get(r.cuisine) ?? []), r]);
  const cuisines = [...byCuisine.keys()].sort((a, b) => Number(a === "International") - Number(b === "International") || a.localeCompare(b));
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Recipes</h1>
        <p className="text-lg text-muted">
          {LIBRARY.length} everyday recipes from {cuisines.length} cuisines. Each one lists exact ingredient weights, so nutrition is
          calculated from USDA food data rather than guessed.
        </p>
      </header>
      <nav aria-label="Cuisines" className="mb-8 flex flex-wrap gap-2">
        {cuisines.map((c) => (
          <a key={c} href={`#${c.toLowerCase().replace(/\s+/g, "-")}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-brand">
            {c}
          </a>
        ))}
      </nav>
      <div className="grid gap-8">
        {cuisines.map((c) => (
          <section key={c} id={c.toLowerCase().replace(/\s+/g, "-")} aria-labelledby={`h-${c}`}>
            <h2 id={`h-${c}`} className="mb-3 text-xl font-bold">
              {c}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byCuisine.get(c)!.map((r) => (
                <li key={r.slug} className="card grid gap-1">
                  <Link href={`/recipes/${r.slug}`} className="font-semibold hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-sm text-muted">{r.description}</p>
                  <p className="text-xs text-muted">
                    {r.totalMinutes} min · {PATTERN_LABEL[r.pattern]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
