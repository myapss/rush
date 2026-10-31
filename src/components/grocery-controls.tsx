"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { addGroceryItem, toggleGroceryItem, type GroceryActionState } from "@/lib/actions/grocery";

export function GroceryCheckbox({ itemId, checked, label }: { itemId: string; checked: boolean; label: string }) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, startTransition] = useTransition();
  return (
    <input
      type="checkbox"
      className="size-5 accent-[var(--brand)]"
      checked={optimistic}
      aria-label={`Got ${label}`}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(async () => {
          setOptimistic(next);
          await toggleGroceryItem(itemId, next);
        });
      }}
    />
  );
}

export function AddGroceryItem({ listId }: { listId: string }) {
  const [state, action, pending] = useActionState<GroceryActionState, FormData>(addGroceryItem, { status: "idle" });
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end print:hidden">
      <input type="hidden" name="listId" value={listId} />
      <label className="label">
        Add an item
        <input className="input" name="name" maxLength={120} placeholder="e.g. Bread" required />
      </label>
      <label className="label">
        Amount
        <input className="input" name="quantity" type="number" min={0} step="any" inputMode="decimal" />
      </label>
      <label className="label">
        Unit
        <input className="input" name="unit" maxLength={30} placeholder="e.g. loaf" />
      </label>
      <button type="submit" className="btn" disabled={pending}>
        Add
      </button>
      {state.status === "error" && (
        <p role="alert" className="error-text sm:col-span-4">
          {state.message}
        </p>
      )}
    </form>
  );
}
