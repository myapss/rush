import type { MetadataRoute } from "next";
import { MEAL_PLAN_PAGES } from "@/content/meal-plans";
import { siteUrl } from "@/lib/env";
import { LIBRARY } from "@/lib/library";

// Only public, indexable pages with real content.
const PATHS = [
  "/",
  "/calorie-calculator",
  "/tdee-calculator",
  "/protein-calculator",
  "/bmi-calculator",
  "/food-database",
  "/meal-plans",
  "/recipes",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/nutrition-disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PATHS,
    ...MEAL_PLAN_PAGES.map((p) => `/meal-plans/${p.slug}`),
    ...LIBRARY.map((r) => `/recipes/${r.slug}`),
  ].map((path) => ({ url: `${siteUrl}${path}` }));
}
