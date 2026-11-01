import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built ChopPlanner and the principles behind it: sourced nutrition data, safety first, and food from around the world.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className="container-page prose-page max-w-3xl py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">About ChopPlanner</h1>
      <p>
        ChopPlanner helps people around the world plan practical meals for their goals, using the foods they actually
        eat, at a budget that works for them.
      </p>
      <h2>Why &quot;Chop&quot;?</h2>
      <p>
        In Nigerian and West African Pidgin, to <em>chop</em> means to eat. ChopPlanner started with a simple idea: everyone
        deserves a meal plan built around the food they love, whether that&apos;s jollof and moi moi, dal and rice, or tacos and
        beans. Eat smart, wherever you are.
      </p>
      <h2>Our principles</h2>
      <ul>
        <li><strong>Sourced numbers.</strong> Calorie and nutrient values come from food-composition databases such as USDA FoodData Central, and we record the source. AI helps arrange and explain meals but never invents nutrition values.</li>
        <li><strong>Safety first.</strong> We use recognized equations with clear limits, and we don&apos;t give calorie targets to children, during pregnancy, or to anyone with a history of disordered eating.</li>
        <li><strong>No miracle claims.</strong> We don&apos;t promise guaranteed weight loss or health outcomes. Bodies differ, and our numbers are estimates.</li>
        <li><strong>Your data is yours.</strong> We collect only what&apos;s needed, ask before storing health information, and let you export or delete everything.</li>
        <li><strong>Food from everywhere.</strong> Jollof rice, dal, pho and feijoada belong in a healthy diet as much as salad does.</li>
      </ul>
    </article>
  );
}
