"use client";

import { useActionState } from "react";
import { generatePlanAction, swapMealAction, type PlanActionState } from "@/lib/actions/plans";

export function GeneratePlanButton({ label = "Create my 7-day plan" }: { label?: string }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(generatePlanAction, { status: "idle" });
  return (
    <form action={action} className="grid gap-2">
      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Planning your week…" : label}
      </button>
      {pending && <p className="text-sm text-muted" role="status">This can take up to a minute.</p>}
      {state.status === "error" && (
        <p role="alert" className="notice text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SwapMealButton({ plannedMealId, title }: { plannedMealId: string; title: string }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(swapMealAction, { status: "idle" });
  return (
    <form action={action}>
      <input type="hidden" name="plannedMealId" value={plannedMealId} />
      <button type="submit" className="rounded-md px-2 py-1 text-sm text-muted hover:bg-brand-soft hover:text-fg" disabled={pending} aria-label={`Swap ${title}`}>
        {pending ? "Swapping…" : "↻ Swap"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="error-text text-xs">
          {state.message}
        </p>
      )}
    </form>
  );
}
