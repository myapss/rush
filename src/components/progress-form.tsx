"use client";

import { useActionState } from "react";
import { saveProgressEntry, type ProgressState } from "@/lib/actions/progress";

export function ProgressForm({ units, today }: { units: "metric" | "imperial"; today: string }) {
  const [state, action, pending] = useActionState<ProgressState, FormData>(saveProgressEntry, { status: "idle" });
  const imperial = units === "imperial";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="units" value={units} />
      <label className="label">
        Date
        <input className="input" type="date" name="entryDate" defaultValue={today} max={today} required />
      </label>
      <label className="label">
        Weight ({imperial ? "lb" : "kg"})
        <input className="input" type="number" name="weight" step="0.1" min={0} inputMode="decimal" />
      </label>
      <label className="label">
        Waist ({imperial ? "in" : "cm"})
        <input className="input" type="number" name="waist" step="0.1" min={0} inputMode="decimal" />
      </label>
      <label className="label">
        Plan followed (%)
        <input className="input" type="number" name="adherence" min={0} max={100} step={5} inputMode="numeric" />
      </label>
      <label className="label sm:col-span-2 lg:col-span-4">
        Notes (optional)
        <textarea className="input min-h-20" name="notes" maxLength={2000} placeholder="How did you feel? Anything worth remembering?" />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save entry"}
        </button>
        {state.status === "saved" && <p role="status" className="text-sm font-semibold text-brand">Saved.</p>}
        {state.status === "error" && (
          <p role="alert" className="error-text">
            {state.message}
          </p>
        )}
      </div>
      <p className="hint sm:col-span-2 lg:col-span-4">Saving a second entry for the same date replaces the first.</p>
    </form>
  );
}
