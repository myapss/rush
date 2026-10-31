import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

// Only public, indexable pages with real content.
const PATHS = [
  "/",
  "/calorie-calculator",
  "/tdee-calculator",
  "/protein-calculator",
  "/bmi-calculator",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/nutrition-disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${siteUrl}${path}` }));
}
