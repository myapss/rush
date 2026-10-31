import { MEAL_PLAN_PAGES } from "@/content/meal-plans";
import { RECIPES } from "../../data/recipes";

const RECIPE_SLUGS = new Set(RECIPES.map((r) => r.slug));
const PLAN_SLUGS = new Set(MEAL_PLAN_PAGES.map((p) => p.slug));

/**
 * Content routes are static lists. With Cache Components, unknown params
 * would otherwise render a not-found page with status 200 ("soft 404").
 */
export function isUnknownContentPath(pathname: string): boolean {
  const m = pathname.match(/^\/(recipes|meal-plans)\/([^/]+)\/?$/);
  if (!m) return false;
  return m[1] === "recipes" ? !RECIPE_SLUGS.has(m[2]) : !PLAN_SLUGS.has(m[2]);
}
