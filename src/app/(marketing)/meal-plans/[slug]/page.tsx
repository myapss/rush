import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbs, JsonLd } from "@/components/json-ld";
import { MEAL_PLAN_BY_SLUG, MEAL_PLAN_PAGES } from "@/content/meal-plans";
import { siteUrl } from "@/lib/env";
import { sampleWeek } from "@/lib/library";

// Unknown slugs return a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MEAL_PLAN_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/meal-plans/[slug]">): Promise<Metadata> {
  const p = MEAL_PLAN_BY_SLUG.get((await params).slug);
  if (!p) return {};
  return { title: { absolute: `${p.metaTitle} | ChopPlanner` }, description: p.description, alternates: { canonical: `/meal-plans/${p.slug}` } };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export default async function MealPlanPage({ params }: PageProps<"/meal-plans/[slug]">) {
  const page = MEAL_PLAN_BY_SLUG.get((await params).slug);
  if (!page) notFound();
  const week = sampleWeek(page.filter, page.prefer);
  const others = MEAL_PLAN_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <article className="container-page py-10 sm:py-14">
      <JsonLd data={breadcrumbs(siteUrl, [["Meal plans", "/meal-plans"], [page.title, `/meal-plans/${page.slug}`]])} />
      <div className="max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
          <Link href="/meal-plans" className="hover:underline">
            Meal plans
          </Link>{" "}
          › {page.label}
        </nav>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{page.title}</h1>
        {page.intro.map((t) => (
          <p key={t} className="mb-3 text-lg text-muted">
            {t}
          </p>
        ))}
        <div className="my-6 flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-primary">
            Get this plan sized for me
          </Link>
          <Link href="/calorie-calculator" className="btn">
            Calculate my calories
          </Link>
        </div>
      </div>

      <section aria-labelledby="week-h" className="my-10">
        <h2 id="week-h" className="mb-2 text-2xl font-bold">
          Example week
        </h2>
        <p className="mb-4 max-w-3xl text-muted">
          Portions aren&apos;t shown because they depend on your calorie needs. Your personal plan sizes every meal for you.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {week.map((day, i) => (
            <section key={DAYS[i]} className="card" aria-label={DAYS[i]}>
              <h3 className="mb-2 font-bold">{DAYS[i]}</h3>
              <dl className="grid gap-1.5 text-sm">
                {MEALS.map((m) => (
                  <div key={m}>
                    <dt className="text-xs font-bold uppercase tracking-wide text-brand">{m}</dt>
                    <dd>
                      <Link href={`/recipes/${day[m].slug}`} className="hover:underline">
                        {day[m].title}
                      </Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>

      <div className="prose-page max-w-3xl">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((t) => <p key={t}>{t}</p>)}
            {s.bullets && (
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <h2>Common questions</h2>
        {page.faq.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
        <p className="text-sm">
          This page is general information for healthy adults, not medical advice. See our{" "}
          <Link href="/nutrition-disclaimer">nutrition disclaimer</Link>.
        </p>
      </div>

      <nav aria-label="Other meal plans" className="mt-10">
        <h2 className="mb-3 text-lg font-bold">More meal plans</h2>
        <ul className="flex flex-wrap gap-2">
          {others.map((p) => (
            <li key={p.slug}>
              <Link href={`/meal-plans/${p.slug}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-brand">
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
