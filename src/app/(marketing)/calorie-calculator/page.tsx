import type { Metadata } from "next";
import Link from "next/link";
import { ToolPage } from "@/components/tool-page";

export const metadata: Metadata = {
  title: "Calorie Calculator: Daily Calories and Macros",
  description:
    "Estimate how many calories you need per day to lose, maintain or gain weight, with protein, carb and fat targets. Free, metric or imperial.",
  alternates: { canonical: "/calorie-calculator" },
};

export default function Page() {
  return (
    <ToolPage
      mode="calorie"
      title="Calorie calculator"
      intro="Estimate your daily calories and macronutrients for losing, maintaining or gaining weight. It works in metric or imperial units."
    >
      <h2>How we estimate your calories</h2>
      <p>
        We first estimate your basal metabolic rate (BMR), the energy your body uses at rest, with the Mifflin-St Jeor
        equation. We multiply it by an activity factor to get your total daily energy expenditure (TDEE). Your target is then
        set from your goal:
      </p>
      <ul>
        <li>
          <strong>Lose weight:</strong> a deficit of up to 20% of TDEE, and never more than 500 kcal a day. That&apos;s
          roughly 0.25–0.5 kg (0.5–1 lb) a week for most people.
        </li>
        <li>
          <strong>Maintain or eat healthier:</strong> within 5% of TDEE.
        </li>
        <li>
          <strong>Gain weight or build muscle:</strong> a modest surplus of 5–10% above TDEE.
        </li>
      </ul>
      <h2>Safety limits</h2>
      <p>
        We never suggest less than 1,200 kcal a day (1,500 kcal for men) without medical supervision. We don&apos;t offer
        weight-loss targets if your BMI is under 18.5. We don&apos;t calculate targets for under-18s, during pregnancy or
        breastfeeding, or for anyone with a history of disordered eating. In those cases, a healthcare professional is the
        right place to start.
      </p>
      <h2>How macros are split</h2>
      <p>
        Protein is set per kilogram of body weight depending on your goal (see the{" "}
        <Link href="/protein-calculator">protein calculator</Link>). Fat is about 30% of calories, and carbohydrates make up
        the rest. These are sensible starting points, not rules. Adjust them to your preferences and how you feel.
      </p>
      <h2>Why your result is an estimate</h2>
      <p>
        Equations predict average needs. Your actual needs can differ by 10–20% because of genetics, body composition, sleep,
        stress and how active you really are. Track your weight trend over 2–4 weeks and adjust by 100–200 kcal at a time if
        needed. Day-to-day weight changes are mostly water, not fat.
      </p>
    </ToolPage>
  );
}
