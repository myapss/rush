import Link from "next/link";
import { CookieSettingsButton } from "@/components/analytics";

const GROUPS = [
  {
    title: "Free tools",
    links: [
      { href: "/calorie-calculator", label: "Calorie calculator" },
      { href: "/tdee-calculator", label: "TDEE calculator" },
      { href: "/protein-calculator", label: "Protein calculator" },
      { href: "/bmi-calculator", label: "BMI calculator" },
      { href: "/food-database", label: "Food database" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/nutrition-disclaimer", label: "Nutrition disclaimer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-sm text-sm text-muted">
          <p className="mb-2 font-bold text-fg">NutriPlan AI</p>
          <p>
            General nutrition information for healthy adults, not medical advice. If you are pregnant, have a medical
            condition or a history of disordered eating, talk to a qualified healthcare professional.
          </p>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title} className="text-sm">
            <p className="mb-2 font-semibold">{g.title}</p>
            <ul className="space-y-1.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
              {g.title === "Legal" && (
                <li>
                  <CookieSettingsButton />
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
