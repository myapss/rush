"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProfile, type ProfileFormState } from "@/lib/actions/profile";
import {
  ACTIVITY_OPTIONS,
  ALLERGENS,
  CUISINES,
  CURRENCIES,
  DIETARY_PATTERNS,
  FOOD_RESTRICTIONS,
  GOAL_OPTIONS,
} from "@/lib/reference";
import { cmFromFeetInches, feetInchesFromCm, kgFromLb, lbFromKg } from "@/lib/units";

export interface ProfileDefaults {
  displayName: string;
  country: string;
  currency: string;
  units: "metric" | "imperial";
  birthYear: string;
  sex: string;
  heightCm: number | null;
  weightKg: number | null;
  healthConsent: boolean;
  flags: { pregnantOrBreastfeeding?: boolean; eatingDisorderHistory?: boolean; medicalCondition?: boolean };
  goal: string;
  activity: string;
  dietaryPattern: string;
  allergies: string[];
  restrictions: string[];
  cuisines: string[];
  likedFoods: string[];
  dislikedFoods: string[];
  mealsPerDay: number;
  includeSnacks: boolean;
  maxCookMinutes: number | null;
  cookingSkill: string;
  budgetAmount: number | null;
  budgetPeriod: string;
}

/** Re-apply raw submitted values on top of the saved defaults. */
function withSubmitted(d: ProfileDefaults, v: Record<string, unknown>): ProfileDefaults {
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const num = (k: string) => (str(k) === "" || Number.isNaN(Number(str(k))) ? null : Number(str(k)));
  const list = (k: string) => (Array.isArray(v[k]) ? (v[k] as string[]) : []);
  const units = str("units") === "imperial" ? "imperial" : "metric";
  const ft = num("heightFt");
  const lb = num("weightLb");
  return {
    ...d,
    displayName: str("displayName"),
    country: str("country"),
    currency: str("currency") || d.currency,
    units,
    birthYear: str("birthYear"),
    sex: str("sex") || d.sex,
    heightCm: units === "metric" ? num("heightCm") : ft !== null ? cmFromFeetInches(ft, num("heightIn") ?? 0) : null,
    weightKg: units === "metric" ? num("weightKg") : lb !== null ? kgFromLb(lb) : null,
    healthConsent: v.healthConsent === "on",
    flags: {
      pregnantOrBreastfeeding: v.pregnantOrBreastfeeding === "on",
      eatingDisorderHistory: v.eatingDisorderHistory === "on",
      medicalCondition: v.medicalCondition === "on",
    },
    goal: str("goal") || d.goal,
    activity: str("activity") || d.activity,
    dietaryPattern: str("dietaryPattern") || d.dietaryPattern,
    allergies: list("allergies"),
    restrictions: list("restrictions"),
    cuisines: list("cuisines"),
    likedFoods: str("likedFoods") ? [str("likedFoods")] : [],
    dislikedFoods: str("dislikedFoods") ? [str("dislikedFoods")] : [],
    mealsPerDay: num("mealsPerDay") ?? d.mealsPerDay,
    includeSnacks: v.includeSnacks === "on",
    maxCookMinutes: num("maxCookMinutes"),
    cookingSkill: str("cookingSkill") || d.cookingSkill,
    budgetAmount: num("budgetAmount"),
    budgetPeriod: str("budgetPeriod") || d.budgetPeriod,
  };
}

function FieldError({ state, name }: { state: ProfileFormState; name: string }) {
  if (state.status !== "error" || !state.fieldErrors[name]) return null;
  return (
    <span className="error-text" id={`${name}-error`}>
      {state.fieldErrors[name]}
    </span>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">{title}</legend>
      <div className="sm:col-span-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function ProfileForm({
  mode,
  defaults: saved,
  countries,
}: {
  mode: "onboarding" | "settings";
  defaults: ProfileDefaults;
  countries: { code: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile.bind(null, mode), {
    status: "idle",
  });
  const failed = state.status === "error" && state.values ? state : null;
  // Remount with the submitted values after a failed attempt (React resets forms after an action).
  return (
    <ProfileFormFields
      key={failed?.attempt ?? "saved"}
      state={state}
      action={action}
      pending={pending}
      mode={mode}
      defaults={failed?.values ? withSubmitted(saved, failed.values) : saved}
      countries={countries}
    />
  );
}

function ProfileFormFields({
  state,
  action,
  pending,
  mode,
  defaults,
  countries,
}: {
  state: ProfileFormState;
  action: (fd: FormData) => void;
  pending: boolean;
  mode: "onboarding" | "settings";
  defaults: ProfileDefaults;
  countries: { code: string; name: string }[];
}) {
  const [units, setUnits] = useState(defaults.units);
  const ftIn = defaults.heightCm ? feetInchesFromCm(defaults.heightCm) : null;
  const err = (name: string) => (state.status === "error" && state.fieldErrors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      {state.status === "error" && (
        <p role="alert" className="notice">
          {state.message}
        </p>
      )}

      <Section title="About you" description="Used to show units, prices and food that make sense where you live.">
        <label className="label">
          Name (optional)
          <input className="input" name="displayName" defaultValue={defaults.displayName} maxLength={80} autoComplete="given-name" />
        </label>
        <label className="label">
          Country or region
          <select className="input" name="country" defaultValue={defaults.country} required {...err("country")}>
            <option value="">Choose…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError state={state} name="country" />
        </label>
        <label className="label">
          Currency for budgets
          <select className="input" name="currency" defaultValue={defaults.currency} required {...err("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError state={state} name="currency" />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Units</legend>
          <div className="flex flex-wrap gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <label key={u} className="chip">
                <input type="radio" name="units" value={u} checked={units === u} onChange={() => setUnits(u)} />
                {u === "metric" ? "Metric" : "Imperial"}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="label">
          Birth year
          <input
            className="input"
            name="birthYear"
            type="number"
            inputMode="numeric"
            defaultValue={defaults.birthYear}
            required
            {...err("birthYear")}
          />
          <span className="hint">NutriPlan AI is for adults 18+.</span>
          <FieldError state={state} name="birthYear" />
        </label>
      </Section>

      <Section
        title="Body details (optional)"
        description="Needed to estimate your calorie targets. These count as health information, so we only store them with your consent."
      >
        <label className="label">
          Sex (for the energy equation)
          <select className="input" name="sex" defaultValue={defaults.sex}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="unspecified">Prefer not to say</option>
          </select>
        </label>
        {units === "metric" ? (
          <label className="label">
            Height (cm)
            <input className="input" name="heightCm" type="number" inputMode="decimal" defaultValue={defaults.heightCm ?? ""} {...err("height")} />
            <FieldError state={state} name="height" />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="label">
              Height (ft)
              <input className="input" name="heightFt" type="number" inputMode="numeric" defaultValue={ftIn?.feet ?? ""} {...err("height")} />
            </label>
            <label className="label">
              (in)
              <input className="input" name="heightIn" type="number" inputMode="numeric" defaultValue={ftIn?.inches ?? ""} />
            </label>
            <span className="col-span-2">
              <FieldError state={state} name="height" />
            </span>
          </div>
        )}
        {units === "metric" ? (
          <label className="label">
            Weight (kg)
            <input className="input" name="weightKg" type="number" inputMode="decimal" step="0.1" defaultValue={defaults.weightKg ?? ""} {...err("weight")} />
            <FieldError state={state} name="weight" />
          </label>
        ) : (
          <label className="label">
            Weight (lb)
            <input
              className="input"
              name="weightLb"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={defaults.weightKg ? Math.round(lbFromKg(defaults.weightKg) * 10) / 10 : ""}
              {...err("weight")}
            />
            <FieldError state={state} name="weight" />
          </label>
        )}
        <div className="grid gap-2 text-sm sm:col-span-2">
          <p className="font-semibold">Do any of these apply? (optional)</p>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="pregnantOrBreastfeeding" defaultChecked={defaults.flags.pregnantOrBreastfeeding} className="mt-1" />
            Pregnant or breastfeeding
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="eatingDisorderHistory" defaultChecked={defaults.flags.eatingDisorderHistory} className="mt-1" />
            Current or past eating disorder
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="medicalCondition" defaultChecked={defaults.flags.medicalCondition} className="mt-1" />
            A medical condition that affects what I eat (e.g. diabetes, kidney disease)
          </label>
          <p className="hint">We use these only to keep recommendations safe, for example by not showing calorie targets.</p>
        </div>
        <label className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-sm sm:col-span-2">
          <input type="checkbox" name="healthConsent" defaultChecked={defaults.healthConsent} className="mt-1" {...err("healthConsent")} />
          <span>
            I consent to NutriPlan AI storing my body measurements and the health information above to personalize my
            plans. I can withdraw consent at any time in Settings, which deletes this information. See the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
            <FieldError state={state} name="healthConsent" />
          </span>
        </label>
      </Section>

      <Section title="Goal and activity">
        <label className="label">
          Goal
          <select className="input" name="goal" defaultValue={defaults.goal}>
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Activity level
          <select className="input" name="activity" defaultValue={defaults.activity}>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Food preferences">
        <label className="label">
          Eating style
          <select className="input" name="dietaryPattern" defaultValue={defaults.dietaryPattern}>
            {DIETARY_PATTERNS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Meals per day
          <select className="input" name="mealsPerDay" defaultValue={String(defaults.mealsPerDay)}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Allergies and intolerances</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <label key={a.value} className="chip">
                <input type="checkbox" name="allergies" value={a.value} defaultChecked={defaults.allergies.includes(a.value)} />
                {a.label}
              </label>
            ))}
          </div>
          <FieldError state={state} name="allergies" />
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Other foods to avoid</legend>
          <div className="flex flex-wrap gap-2">
            {FOOD_RESTRICTIONS.map((a) => (
              <label key={a.value} className="chip">
                <input type="checkbox" name="restrictions" value={a.value} defaultChecked={defaults.restrictions.includes(a.value)} />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Favourite cuisines</legend>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <label key={c} className="chip">
                <input type="checkbox" name="cuisines" value={c} defaultChecked={defaults.cuisines.includes(c)} />
                {c}
              </label>
            ))}
          </div>
          <FieldError state={state} name="cuisines" />
        </fieldset>
        <label className="label">
          Foods you like
          <input className="input" name="likedFoods" defaultValue={defaults.likedFoods.join(", ")} placeholder="e.g. beans, plantain, salmon" {...err("likedFoods")} />
          <span className="hint">Separate with commas.</span>
          <FieldError state={state} name="likedFoods" />
        </label>
        <label className="label">
          Foods you dislike
          <input className="input" name="dislikedFoods" defaultValue={defaults.dislikedFoods.join(", ")} placeholder="e.g. mushrooms, okra" {...err("dislikedFoods")} />
          <span className="hint">Separate with commas.</span>
          <FieldError state={state} name="dislikedFoods" />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="includeSnacks" defaultChecked={defaults.includeSnacks} />
          Include snacks in my plans
        </label>
      </Section>

      <Section title="Cooking and budget">
        <label className="label">
          Max cooking time per meal
          <select className="input" name="maxCookMinutes" defaultValue={defaults.maxCookMinutes ? String(defaults.maxCookMinutes) : ""}>
            <option value="">No limit</option>
            {[15, 30, 45, 60, 90].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Cooking skill
          <select className="input" name="cookingSkill" defaultValue={defaults.cookingSkill}>
            <option value="easy">Easy recipes only</option>
            <option value="medium">Some experience</option>
            <option value="advanced">Confident cook</option>
          </select>
        </label>
        <label className="label">
          Food budget (optional)
          <input className="input" name="budgetAmount" type="number" inputMode="decimal" min={0} defaultValue={defaults.budgetAmount ?? ""} {...err("budgetAmount")} />
          <FieldError state={state} name="budgetAmount" />
        </label>
        <label className="label">
          Budget period
          <select className="input" name="budgetPeriod" defaultValue={defaults.budgetPeriod}>
            <option value="week">Per week</option>
            <option value="day">Per day</option>
          </select>
        </label>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : mode === "onboarding" ? "Save and continue" : "Save changes"}
        </button>
        {state.status === "saved" && (
          <p role="status" className="text-sm font-semibold text-brand">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
