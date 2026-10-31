import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "NutriPlan AI is free to start. Premium adds more AI meal plans, recipe generations and meal swaps.",
  alternates: { canonical: "/pricing" },
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Calorie, TDEE, protein and BMI calculators", "Saved preferences and daily targets", "1 AI meal plan per month", "3 recipe generations per month", "Basic grocery list"],
    cta: { href: "/signup", label: "Start free" },
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month, or $59.99 per year",
    features: ["30 AI meal plans per month", "200 recipe generations per month", "Meal and ingredient swaps", "Saved and reusable plans", "Advanced progress charts"],
    cta: null,
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Pricing</h1>
      <p className="mb-10 max-w-2xl text-lg text-muted">
        Start free. Premium will be available once the AI meal planner launches, and you&apos;ll be able to cancel any time
        from your account.
      </p>
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        {PLANS.map((p) => (
          <section key={p.name} className="card flex flex-col gap-4" aria-labelledby={`plan-${p.name}`}>
            <div>
              <h2 id={`plan-${p.name}`} className="text-xl font-bold">
                {p.name}
              </h2>
              <p>
                <span className="text-4xl font-extrabold">{p.price}</span> <span className="text-muted">{p.period}</span>
              </p>
            </div>
            <ul className="flex-1 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="text-brand">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {p.cta ? (
              <Link href={p.cta.href} className="btn btn-primary">
                {p.cta.label}
              </Link>
            ) : (
              <p className="rounded-lg bg-surface-2 p-3 text-center text-sm font-semibold text-muted">Coming soon</p>
            )}
          </section>
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        Prices are in US dollars. Local currency pricing and applicable taxes will be shown at checkout. Limits reset on the
        first day of each month (UTC).
      </p>
    </div>
  );
}
