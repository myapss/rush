import type { Metadata } from "next";
import Link from "next/link";
import { MEAL_PLAN_PAGES } from "@/content/meal-plans";

export const metadata: Metadata = {
  title: "Free 7-Day Meal Plans",
  description: "Free example meal plans for weight loss, high protein, vegetarian, vegan, budget, Mediterranean, Nigerian, Indian and American eating.",
  alternates: { canonical: "/meal-plans" },
};

export default function MealPlansHub() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Free 7-day meal plans</h1>
        <p className="text-lg text-muted">
          Example weeks for different goals and cuisines, with practical guidance for each. When you sign up, we turn them into a
          personal plan with portions sized to your calorie target, your allergies respected, and a shopping list.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MEAL_PLAN_PAGES.map((p) => (
          <li key={p.slug} className="card grid content-start gap-2">
            <Link href={`/meal-plans/${p.slug}`} className="text-lg font-bold hover:underline">
              {p.title}
            </Link>
            <p className="text-sm text-muted">{p.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
