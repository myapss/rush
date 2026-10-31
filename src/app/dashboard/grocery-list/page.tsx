import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddGroceryItem, GroceryCheckbox } from "@/components/grocery-controls";
import { PrintButton } from "@/components/print-button";
import { deleteGroceryItem, setHouseholdSize, updateGroceryItem } from "@/lib/actions/grocery";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { CATEGORY_LABEL, categoryRank, formatGrams } from "@/lib/grocery/build";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Shopping list" };

export default function GroceryPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading your list…</p>}>
      <Grocery />
    </Suspense>
  );
}

async function Grocery() {
  const user = await requireUser("/dashboard/grocery-list");
  const supabase = await createClient();
  const [{ profile }, { data: plan }] = await Promise.all([
    getProfileAndPreferences(user.id),
    supabase.from("meal_plans").select("id, title").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);
  const { data: list } = plan
    ? await supabase.from("grocery_lists").select("id, title, household_size, grocery_items(id, name, quantity, unit, category, checked, source)").eq("meal_plan_id", plan.id).maybeSingle()
    : { data: null };

  if (!plan || !list) {
    return (
      <div className="grid max-w-2xl gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping list</h1>
        <p className="card text-muted">
          Your shopping list is created automatically from your meal plan.{" "}
          <Link href="/dashboard/my-meals" className="font-semibold text-brand underline">
            Create a meal plan
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  const units = profile.measurement_unit;
  const household = list.household_size;
  const items = [...list.grocery_items].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name),
  );
  const groups = new Map<string, typeof items>();
  for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  const done = items.filter((i) => i.checked).length;

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Shopping list</h1>
          <p className="text-muted">
            {plan.title} · {done} of {items.length} ticked
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <form action={setHouseholdSize} className="flex items-end gap-2">
            <input type="hidden" name="listId" value={list.id} />
            <label className="label">
              People
              <select className="input w-24" name="householdSize" defaultValue={String(household)}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn">
              Update
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      {[...groups].map(([category, rows]) => (
        <section key={category} className="card" aria-labelledby={`cat-${category}`}>
          <h2 id={`cat-${category}`} className="mb-2 font-bold">
            {CATEGORY_LABEL[category] ?? "Other"}
          </h2>
          <ul className="divide-y divide-border">
            {rows.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2">
                <GroceryCheckbox itemId={i.id} checked={i.checked} label={i.name} />
                <details className="flex-1">
                  <summary className={`cursor-pointer list-none ${i.checked ? "text-muted line-through" : ""}`}>{i.name}</summary>
                  <form action={updateGroceryItem} className="mt-2 flex gap-2 print:hidden">
                    <input type="hidden" name="itemId" value={i.id} />
                    <input className="input" name="name" defaultValue={i.name} maxLength={120} aria-label={`Rename ${i.name}`} required />
                    <button type="submit" className="btn">
                      Save
                    </button>
                  </form>
                </details>
                <span className="text-sm tabular-nums text-muted">
                  {i.quantity === null
                    ? ""
                    : i.source === "plan" && i.unit === "g"
                      ? formatGrams(Number(i.quantity) * household, units)
                      : `${Number(i.quantity)}${i.unit ? ` ${i.unit}` : ""}`}
                </span>
                <form action={deleteGroceryItem} className="print:hidden">
                  <input type="hidden" name="itemId" value={i.id} />
                  <button type="submit" className="rounded-md px-2 py-1 text-sm text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${i.name}`}>
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card">
        <AddGroceryItem listId={list.id} />
      </section>
      <p className="text-sm text-muted print:hidden">
        Amounts are the total for the week{household > 1 ? ` for ${household} people` : ""}, based on edible weight. Swapping
        a meal updates this list and keeps your ticks and added items.
      </p>
    </div>
  );
}
