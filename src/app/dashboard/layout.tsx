import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | NutriPlan AI" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/my-meals", label: "My meals" },
  { href: "/dashboard/grocery-list", label: "Shopping" },
  { href: "/dashboard/recipes", label: "Recipes" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface print:hidden">
        <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <Link href="/dashboard" className="text-lg font-extrabold">
            <span aria-hidden>🥗</span> NutriPlan <span className="text-brand">AI</span>
          </Link>
          <nav aria-label="Account" className="-mx-2 flex w-full flex-wrap items-center gap-x-1 text-sm sm:mx-0 sm:w-auto">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-fg">
                {n.label}
              </Link>
            ))}
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-fg">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main id="main" className="container-page flex-1 py-8">
        {children}
      </main>
    </div>
  );
}
