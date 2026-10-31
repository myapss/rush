"use client";

import Link from "next/link";
import { useState } from "react";
import { bmi as calcBmi, bmiCategory, weightForBmi } from "@/lib/nutrition/bmi";
import { trackEvent } from "@/lib/consent";
import { NOT_APPLICABLE_MESSAGE, NOTE_MESSAGE } from "@/lib/nutrition/messages";
import { computeTargets } from "@/lib/nutrition/targets";
import type { ActivityLevel, Goal, Sex, TargetsResult } from "@/lib/nutrition/types";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from "@/lib/reference";
import { cmFromFeetInches, kgFromLb, lbFromKg } from "@/lib/units";

export type CalculatorMode = "calorie" | "tdee" | "protein" | "bmi";

interface FormState {
  units: "metric" | "imperial";
  age: string;
  sex: Sex;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  weightLb: string;
  activity: ActivityLevel;
  goal: Goal;
  pregnant: boolean;
}

const INITIAL: FormState = {
  units: "metric",
  age: "30",
  sex: "female",
  heightCm: "165",
  heightFt: "5",
  heightIn: "5",
  weightKg: "65",
  weightLb: "143",
  activity: "light",
  goal: "maintain",
  pregnant: false,
};

type Outcome =
  | { kind: "error"; message: string }
  | { kind: "targets"; result: TargetsResult; heightCm: number; weightKg: number }
  | null;

const BMI_LABEL = { underweight: "Underweight", healthy: "Healthy weight range", overweight: "Overweight", obese: "Obesity" };


export function Calculator({ mode }: { mode: CalculatorMode }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const metric = form.units === "metric";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const age = Number(form.age);
    const heightCm = metric ? Number(form.heightCm) : cmFromFeetInches(Number(form.heightFt), Number(form.heightIn || 0));
    const weightKg = metric ? Number(form.weightKg) : kgFromLb(Number(form.weightLb));

    if (!Number.isFinite(age) || age < 2 || age > 100) return setOutcome({ kind: "error", message: "Enter an age between 18 and 100." });
    if (!(heightCm >= 120 && heightCm <= 230))
      return setOutcome({ kind: "error", message: "Enter a height between 120 and 230 cm (3 ft 11 in – 7 ft 6 in)." });
    if (!(weightKg >= 35 && weightKg <= 250))
      return setOutcome({ kind: "error", message: "Enter a weight between 35 and 250 kg (77 – 551 lb)." });

    const result = computeTargets({
      age,
      sex: form.sex,
      heightCm,
      weightKg,
      activity: form.activity,
      goal: mode === "calorie" || mode === "protein" ? form.goal : "maintain",
      flags: { pregnantOrBreastfeeding: form.pregnant },
    });
    setOutcome({ kind: "targets", result, heightCm, weightKg });
    // Which calculator was used, never the values entered.
    trackEvent("calculator_used", { calculator: mode });
  }

  const showActivity = mode !== "bmi";
  const showGoal = mode === "calorie" || mode === "protein";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="card grid gap-4 sm:grid-cols-2" noValidate>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Units</legend>
          <div className="flex flex-wrap gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <label key={u} className="chip">
                <input type="radio" name="units" checked={form.units === u} onChange={() => set("units", u)} />
                {u === "metric" ? "Metric (kg, cm)" : "Imperial (lb, ft/in)"}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="label">
          Age
          <input className="input" type="number" inputMode="numeric" min={18} max={100} value={form.age} onChange={(e) => set("age", e.target.value)} required />
        </label>

        <label className="label">
          Sex
          <select className="input" value={form.sex} onChange={(e) => set("sex", e.target.value as Sex)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
          <span className="hint">Used only for the energy equation.</span>
        </label>

        {metric ? (
          <label className="label">
            Height (cm)
            <input className="input" type="number" inputMode="decimal" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="label">
              Height (ft)
              <input className="input" type="number" inputMode="numeric" value={form.heightFt} onChange={(e) => set("heightFt", e.target.value)} />
            </label>
            <label className="label">
              (in)
              <input className="input" type="number" inputMode="numeric" value={form.heightIn} onChange={(e) => set("heightIn", e.target.value)} />
            </label>
          </div>
        )}

        {metric ? (
          <label className="label">
            Weight (kg)
            <input className="input" type="number" inputMode="decimal" step="0.1" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
          </label>
        ) : (
          <label className="label">
            Weight (lb)
            <input className="input" type="number" inputMode="decimal" step="0.1" value={form.weightLb} onChange={(e) => set("weightLb", e.target.value)} />
          </label>
        )}

        {showActivity && (
          <label className="label sm:col-span-2">
            Activity level
            <select className="input" value={form.activity} onChange={(e) => set("activity", e.target.value as ActivityLevel)}>
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {showGoal && (
          <label className="label sm:col-span-2">
            Goal
            <select className="input" value={form.goal} onChange={(e) => set("goal", e.target.value as Goal)}>
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode !== "bmi" && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.pregnant} onChange={(e) => set("pregnant", e.target.checked)} className="accent-[var(--brand)]" />
            I&apos;m pregnant or breastfeeding
          </label>
        )}

        <button type="submit" className="btn btn-primary sm:col-span-2">
          Calculate
        </button>
      </form>

      <div aria-live="polite">
        {outcome === null && (
          <div className="card flex h-full items-center justify-center text-center text-muted">
            <p>Enter your details and press Calculate to see your estimate.</p>
          </div>
        )}
        {outcome?.kind === "error" && (
          <p role="alert" className="card error-text">
            {outcome.message}
          </p>
        )}
        {outcome?.kind === "targets" && (
          <Results mode={mode} outcome={outcome} imperial={!metric} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, highlight = false }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "opacity-85" : "text-muted"}`}>{label}</p>
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
      {unit && <p className={`text-sm ${highlight ? "opacity-85" : "text-muted"}`}>{unit}</p>}
    </div>
  );
}

function Results({
  mode,
  outcome,
  imperial,
}: {
  mode: CalculatorMode;
  outcome: Extract<Outcome, { kind: "targets" }>;
  imperial: boolean;
}) {
  const { result, heightCm, weightKg } = outcome;
  const fmt = (n: number) => n.toLocaleString("en");

  if (mode === "bmi") {
    const value = calcBmi(weightKg, heightCm);
    const lo = weightForBmi(18.5, heightCm);
    const hi = weightForBmi(24.9, heightCm);
    const w = (kg: number) => (imperial ? `${Math.round(lbFromKg(kg))} lb` : `${Math.round(kg)} kg`);
    return (
      <div className="grid gap-3">
        <Stat label="Your BMI" value={value.toFixed(1)} unit={BMI_LABEL[bmiCategory(value)]} highlight />
        <div className="card text-sm text-muted">
          <p>
            For your height, the WHO healthy BMI range (18.5–24.9) corresponds to about <strong className="text-fg">{w(lo)}–{w(hi)}</strong>.
          </p>
          <p className="mt-2">
            BMI is a rough screening measure. It doesn&apos;t distinguish muscle from fat and is not valid for children or during
            pregnancy.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "not_applicable") {
    return (
      <div className="notice" role="status">
        {NOT_APPLICABLE_MESSAGE[result.reason]}
      </div>
    );
  }

  const notes = result.notes.map((n) => NOTE_MESSAGE[n]).filter((n): n is string => Boolean(n));

  return (
    <div className="grid gap-3">
      {mode === "tdee" ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="TDEE (maintenance)" value={fmt(result.tdee)} unit="kcal / day" highlight />
          <Stat label="BMR (at rest)" value={fmt(result.bmr)} unit="kcal / day" />
        </div>
      ) : mode === "protein" ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Protein" value={`${result.protein.grams} g`} unit={`range ${result.protein.range.min}–${result.protein.range.max} g / day`} highlight />
          <Stat label="Calories" value={fmt(result.calories.target)} unit="kcal / day" />
        </div>
      ) : (
        <>
          <Stat
            label="Daily calories"
            value={fmt(result.calories.target)}
            unit={`suggested range ${fmt(result.calories.range.min)}–${fmt(result.calories.range.max)} kcal`}
            highlight
          />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Protein" value={`${result.protein.grams}g`} />
            <Stat label="Carbs" value={`${result.carbs.grams}g`} />
            <Stat label="Fat" value={`${result.fat.grams}g`} />
          </div>
        </>
      )}
      <div className="card space-y-2 text-sm text-muted">
        {notes.map((n) => (
          <p key={n} className="text-fg">
            {n}
          </p>
        ))}
        <p>
          These are estimates from the Mifflin-St Jeor equation. Real needs vary by up to 10–20% between people, so track how
          you feel and adjust gradually. <Link href="/nutrition-disclaimer" className="underline">Read the disclaimer</Link>.
        </p>
        <p>
          <Link href="/signup" className="font-semibold text-brand underline">
            Turn this into a meal plan →
          </Link>
        </p>
      </div>
    </div>
  );
}
