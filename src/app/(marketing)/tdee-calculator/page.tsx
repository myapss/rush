import type { Metadata } from "next";
import Link from "next/link";
import { ToolPage } from "@/components/tool-page";

export const metadata: Metadata = {
  title: "TDEE Calculator: Total Daily Energy Expenditure",
  description:
    "Calculate your TDEE and BMR (maintenance calories) with the Mifflin-St Jeor equation. Learn what each activity level means.",
  alternates: { canonical: "/tdee-calculator" },
};

export default function Page() {
  return (
    <ToolPage
      mode="tdee"
      title="TDEE calculator"
      intro="Your total daily energy expenditure (TDEE) is roughly how many calories you burn in a day. Eating about this much keeps your weight stable."
    >
      <h2>BMR vs TDEE</h2>
      <p>
        <strong>BMR</strong> (basal metabolic rate) is the energy your body needs at complete rest for breathing,
        circulation and keeping warm. <strong>TDEE</strong> adds everything else: daily movement, exercise and digesting
        food. We calculate BMR with the Mifflin-St Jeor equation:
      </p>
      <ul>
        <li>Men: 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5</li>
        <li>Women: 10 × weight (kg) + 6.25 × height (cm) − 5 × age − 161</li>
      </ul>
      <p>
        If you choose &quot;prefer not to say&quot;, we use the midpoint of the two. TDEE is BMR multiplied by your activity
        factor.
      </p>
      <h2>Choosing your activity level</h2>
      <ul>
        <li><strong>Sedentary (×1.2):</strong> desk job, little intentional exercise.</li>
        <li><strong>Light (×1.375):</strong> exercise or sport 1–3 days a week, or a job with some walking.</li>
        <li><strong>Moderate (×1.55):</strong> exercise 3–5 days a week.</li>
        <li><strong>Very active (×1.725):</strong> hard exercise 6–7 days a week.</li>
        <li><strong>Athlete (×1.9):</strong> training twice a day or heavy physical labour.</li>
      </ul>
      <p>
        Most people overestimate their activity. If you&apos;re unsure, pick the lower option and adjust after a few weeks.
      </p>
      <h2>Next steps</h2>
      <p>
        To set a target for losing or gaining weight, use the <Link href="/calorie-calculator">calorie calculator</Link>,
        which applies safe limits to your TDEE.
      </p>
    </ToolPage>
  );
}
