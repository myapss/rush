"use client";

import { useActionState } from "react";
import { generateRecipeAction, type GeneratorState } from "@/lib/actions/recipe-generator";

const REASON = { allergy: "your allergies", eating_style: "your eating style", restriction: "foods you avoid", dislike: "foods you dislike" } as Record<string, string>;

export function RecipeGeneratorForm() {
  const [state, action, pending] = useActionState<GeneratorState, FormData>(generateRecipeAction, { status: "idle" });
  const leftOut = state.status !== "idle" ? state.leftOut ?? [] : [];
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <label className="label sm:col-span-2">
        Ingredients you have
        <input className="input" name="have" maxLength={400} placeholder="e.g. rice, black-eyed peas, spinach, eggs" />
        <span className="hint">Separate with commas. Leave empty for ideas from anything in our food list.</span>
      </label>
      <label className="label">
        Meal
        <select className="input" name="mealType" defaultValue="">
          <option value="">Any</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="label">
          Servings
          <select className="input" name="servings" defaultValue="2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Max time
          <select className="input" name="maxMinutes" defaultValue="">
            <option value="">No limit</option>
            {[15, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} min
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="label sm:col-span-2">
        Anything else? (optional)
        <textarea className="input min-h-16" name="notes" maxLength={300} placeholder="e.g. spicy, one-pot, kid-friendly" />
      </label>
      <div className="grid gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
          {pending ? "Creating your recipes…" : "Create recipes"}
        </button>
        {pending && <p className="text-sm text-muted" role="status">This can take up to a minute.</p>}
        {state.status === "done" && (
          <p role="status" className="font-semibold text-brand">
            Done! {state.count === 1 ? "Your new recipe is" : `Your ${state.count} new recipes are`} below.
          </p>
        )}
        {state.status === "error" && (
          <p role="alert" className="notice text-sm">
            {state.message}
          </p>
        )}
        {leftOut.length > 0 && (
          <p className="text-sm text-muted">
            Left out for your safety:{" "}
            {leftOut.map((l, i) => (
              <span key={i}>
                {i > 0 && "; "}
                {l.food} (because of {REASON[l.reason] ?? "your preferences"})
              </span>
            ))}
            .
          </p>
        )}
        {state.status === "done" && state.unknown.length > 0 && (
          <p className="text-sm text-muted">Not in our food database yet: {state.unknown.join(", ")}.</p>
        )}
      </div>
    </form>
  );
}
