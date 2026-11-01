import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nutrition Disclaimer",
  description: "Important information about the limits of ChopPlanner's calorie estimates, meal plans and nutrition data.",
  alternates: { canonical: "/nutrition-disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <article className="container-page prose-page max-w-3xl py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Nutrition Disclaimer</h1>
      <p>
        ChopPlanner provides general information for healthy adults. It is not medical advice and is not intended to
        diagnose, treat, cure or prevent any disease.
      </p>
      <h2>Estimates, not guarantees</h2>
      <p>
        Calorie and macronutrient targets are estimated with the Mifflin-St Jeor equation and standard activity factors.
        Individual needs vary, and results such as weight change are not guaranteed. Nutrition values for recipes are
        calculated from food-composition databases and are approximate. Actual values depend on brands, portion sizes and
        cooking methods.
      </p>
      <h2>Talk to a professional first if you…</h2>
      <ul>
        <li>are pregnant, trying to conceive or breastfeeding</li>
        <li>are under 18</li>
        <li>have, or have had, an eating disorder</li>
        <li>have diabetes, kidney disease, heart disease or another medical condition</li>
        <li>take medication affected by diet</li>
        <li>have severe food allergies</li>
      </ul>
      <h2>Safety limits we apply</h2>
      <ul>
        <li>No targets below 1,200 kcal a day (1,500 for men) without medical supervision.</li>
        <li>Weight-loss deficits capped at 20% of estimated needs and 500 kcal a day.</li>
        <li>No weight-loss targets when BMI is below 18.5.</li>
        <li>No calorie targets for under-18s, during pregnancy or breastfeeding, or with a history of disordered eating.</li>
      </ul>
      <p>If you feel unwell, dizzy or unusually tired while changing your diet, stop and seek medical advice.</p>
    </article>
  );
}
