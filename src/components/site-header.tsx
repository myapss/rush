import Link from "next/link";

const NAV = [
  { href: "/meal-plans", label: "Meal plans" },
  { href: "/recipes", label: "Recipes" },
  { href: "/calorie-calculator", label: "Calorie calculator" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          <span aria-hidden>🥗</span> NutriPlan <span className="text-brand">AI</span>
        </Link>
        <nav aria-label="Main" className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn border-transparent">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
