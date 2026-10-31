import type { Metadata } from "next";
import { ToolPage } from "@/components/tool-page";

export const metadata: Metadata = {
  title: "Protein Calculator: How Much Protein Per Day?",
  description:
    "Estimate your daily protein needs in grams for weight loss, maintenance or muscle gain, based on body weight and goal.",
  alternates: { canonical: "/protein-calculator" },
};

export default function Page() {
  return (
    <ToolPage
      mode="protein"
      title="Protein calculator"
      intro="Find out roughly how much protein to eat each day for your goal, in grams, with a sensible range."
    >
      <h2>How much protein do adults need?</h2>
      <p>
        The minimum recommended intake for healthy adults is about 0.8 g per kilogram of body weight per day. Higher intakes
        are commonly used when losing weight, to help preserve muscle, or when strength training. Our ranges:
      </p>
      <ul>
        <li><strong>Maintain / eat healthier:</strong> 0.8–1.6 g/kg (we suggest 1.2 g/kg).</li>
        <li><strong>Lose weight:</strong> 1.2–2.0 g/kg (we suggest 1.6 g/kg).</li>
        <li><strong>Build muscle:</strong> 1.6–2.2 g/kg (we suggest 1.8 g/kg).</li>
      </ul>
      <p>
        If your BMI is above 30, we use a reference weight for your height (BMI 25) so the number isn&apos;t inflated. We also
        cap protein at 35% of your calories.
      </p>
      <h2>Kidney disease and other conditions</h2>
      <p>
        Some medical conditions, especially kidney disease, need protein limits set by a doctor or dietitian. If that applies
        to you, please follow their advice rather than this calculator.
      </p>
      <h2>Protein from many cuisines</h2>
      <p>
        You don&apos;t need supplements to reach these numbers. Beans, lentils, chickpeas, tofu, eggs, yogurt, fish,
        chicken and lean meat all count. For example: moi moi, dal, black bean stews, tofu stir-fries or grilled fish. Spread
        protein across your meals.
      </p>
    </ToolPage>
  );
}
