import type { Metadata } from "next";
import Link from "next/link";
import { CUISINES } from "@/lib/reference";

export const metadata: Metadata = {
  title: { absolute: "ChopPlanner: Eat smart, wherever you are | Personalized meal plans" },
  alternates: { canonical: "/" },
};

const STEPS = [
  { title: "Tell us about you", body: "Your goal, activity, eating style, allergies, favourite cuisines and budget. Body details are optional." },
  { title: "Get your targets", body: "We estimate your calories and macros with a recognized equation and safe limits." },
  { title: "Plan your week", body: "A 7-day plan built from recipes with sourced nutrition data, plus a grocery list." },
];

const FEATURES = [
  { title: "Calorie & macro estimates", body: "Mifflin-St Jeor with clear explanations and guardrails.", ready: true },
  { title: "Allergy-safe by design", body: "Allergies and restrictions are filtered in code, then checked again before anything is shown.", ready: true },
  { title: "Your cuisine, your units", body: "Metric or imperial, local currency, and cuisines from Nigerian to Japanese.", ready: true },
  { title: "AI 7-day meal plans", body: "Personalized plans where every nutrition number comes from a food database, not the AI.", ready: true },
  { title: "Smart grocery lists", body: "Combined, grouped and scaled ingredient lists you can tick off and print.", ready: true },
  { title: "Recipe ideas from your fridge", body: "Tell us what you have and AI suggests recipes using only foods that are safe for you, with nutrition from USDA data.", ready: true },
];

const FAQ = [
  {
    q: "Is ChopPlanner medical advice?",
    a: "No. It provides general nutrition estimates for healthy adults. If you're pregnant, under 18, have a medical condition or a history of disordered eating, please speak to a qualified healthcare professional.",
  },
  {
    q: "Where do the nutrition numbers come from?",
    a: "From food-composition databases such as USDA FoodData Central, with the source recorded for each food. The AI arranges meals but never invents calorie or nutrient values.",
  },
  {
    q: "Will it work with my country's food?",
    a: "Plans are built around the cuisines you choose. We're expanding regional foods and data sources based on demand.",
  },
  {
    q: "What happens to my data?",
    a: "We collect only what's needed. Body measurements are optional and stored only with your consent. You can export or delete your data at any time from Settings.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-[radial-gradient(1000px_400px_at_15%_0%,var(--brand-soft),transparent_70%)]">
        <div className="container-page py-16 sm:py-24">
          <p className="mb-4 inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            Free calculators · Personalized planning
          </p>
          <h1 className="mb-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Meal plans that fit your goals, your food and your budget
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-muted sm:text-xl">
            Tell us your goal, eating style, allergies and favourite cuisines. ChopPlanner estimates your needs and helps you
            plan practical meals. There are no miracle promises, just sensible, personalized planning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary px-6 text-base">
              Create my meal plan
            </Link>
            <Link href="/calorie-calculator" className="btn px-6 text-base">
              Try the free calorie calculator
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14" aria-labelledby="how">
        <h2 id="how" className="mb-8 text-2xl font-bold sm:text-3xl">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
                {i + 1}
              </span>
              <h3 className="mb-1 font-bold">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface-2 py-14" aria-labelledby="features">
        <div className="container-page">
          <h2 id="features" className="mb-8 text-2xl font-bold sm:text-3xl">
            What you get
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="card">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-bold">{f.title}</h3>
                  {!f.ready && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted">In development</span>
                  )}
                </div>
                <p className="text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-14" aria-labelledby="cuisines">
        <h2 id="cuisines" className="mb-3 text-2xl font-bold sm:text-3xl">
          Cuisines and eating styles
        </h2>
        <p className="mb-6 max-w-2xl text-muted">
          Everything, pescatarian, vegetarian or vegan, with filters for the 14 major allergens plus pork, beef and alcohol.
        </p>
        <ul className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <li key={c} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-surface-2 py-14" aria-labelledby="pricing">
        <div className="container-page">
          <h2 id="pricing" className="mb-3 text-2xl font-bold sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mb-6 max-w-2xl text-muted">
            Start free with one meal plan a month. Premium adds more plans and meal swaps, and you can cancel any time.
          </p>
          <Link href="/pricing" className="btn">
            See plans
          </Link>
        </div>
      </section>

      <section className="container-page py-14" aria-labelledby="faq">
        <h2 id="faq" className="mb-6 text-2xl font-bold sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="grid max-w-3xl gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="mr-2 inline-block text-brand transition group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-2 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="card flex flex-col items-start gap-4 bg-brand-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Ready to plan smarter meals?</h2>
            <p className="text-muted">It takes about two minutes to set up.</p>
          </div>
          <Link href="/signup" className="btn btn-primary">
            Create my meal plan
          </Link>
        </div>
      </section>
    </>
  );
}
