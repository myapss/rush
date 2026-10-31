/**
 * Helpers for reading the USDA FoodData Central "SR Legacy" CSV download
 * (https://fdc.nal.usda.gov/download-datasets). Pure functions so they can be
 * unit-tested against small fixture files.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

/** FDC nutrient IDs (nutrient.csv) for the values we store. */
export const NUTRIENT_IDS = {
  kcal: 1008, // Energy (KCAL)
  protein_g: 1003, // Protein
  fat_g: 1004, // Total lipid (fat)
  carbs_g: 1005, // Carbohydrate, by difference
  fibre_g: 1079, // Fiber, total dietary
  sugar_g: 2000, // Sugars, total including NLEA
  sat_fat_g: 1258, // Fatty acids, total saturated
  sodium_mg: 1093, // Sodium, Na
} as const;
export type NutrientKey = keyof typeof NUTRIENT_IDS;
const ID_TO_KEY = new Map<number, NutrientKey>(
  Object.entries(NUTRIENT_IDS).map(([k, v]) => [v, k as NutrientKey]),
);

/** Parse one CSV line (RFC 4180 quoting). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Stream a CSV file as header-keyed records. */
export async function* readCsv(path: string): AsyncGenerator<Record<string, string>> {
  const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const raw of rl) {
    const line = raw.replace(/^﻿/, "");
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (!header) {
      header = cells;
      continue;
    }
    yield Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  }
}

export interface FdcFood {
  fdcId: number;
  description: string;
  publicationDate: string;
  nutrients: Partial<Record<NutrientKey, number>>;
  portions: { amount: number; unit: string; description: string; gramWeight: number }[];
}

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Token-overlap score used to suggest near matches for a description. */
export function similarity(a: string, b: string): number {
  const ta = new Set(normalize(a).split(/[^a-z0-9%]+/).filter(Boolean));
  const tb = new Set(normalize(b).split(/[^a-z0-9%]+/).filter(Boolean));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.max(ta.size, tb.size, 1);
}

/**
 * Load the requested foods (matched by exact description, case-insensitive)
 * from an extracted SR Legacy folder.
 */
export async function loadFdcFoods(
  dir: string,
  descriptions: string[],
): Promise<{ found: Map<string, FdcFood>; missing: { description: string; suggestions: string[] }[] }> {
  const wanted = new Set(descriptions.map(normalize));
  const byId = new Map<number, FdcFood>();
  const byDesc = new Map<string, FdcFood>();
  const allDescriptions: string[] = [];

  for await (const r of readCsv(`${dir}/food.csv`)) {
    allDescriptions.push(r.description);
    const key = normalize(r.description);
    if (!wanted.has(key) || byDesc.has(key)) continue;
    const food: FdcFood = {
      fdcId: Number(r.fdc_id),
      description: r.description,
      publicationDate: r.publication_date,
      nutrients: {},
      portions: [],
    };
    byId.set(food.fdcId, food);
    byDesc.set(key, food);
  }

  for await (const r of readCsv(`${dir}/food_nutrient.csv`)) {
    const food = byId.get(Number(r.fdc_id));
    const key = ID_TO_KEY.get(Number(r.nutrient_id));
    if (food && key && r.amount !== "") food.nutrients[key] = Number(r.amount);
  }

  const units = new Map<string, string>();
  for await (const r of readCsv(`${dir}/measure_unit.csv`)) units.set(r.id, r.name);
  for await (const r of readCsv(`${dir}/food_portion.csv`)) {
    const food = byId.get(Number(r.fdc_id));
    if (!food || !(Number(r.gram_weight) > 0)) continue;
    const unit = units.get(r.measure_unit_id);
    food.portions.push({
      amount: Number(r.amount) || 1,
      unit: unit && unit !== "undetermined" ? unit : r.modifier || "portion",
      description: [r.portion_description, r.modifier].filter(Boolean).join(" ").trim() || unit || "portion",
      gramWeight: Number(r.gram_weight),
    });
  }

  const found = new Map<string, FdcFood>();
  const missing: { description: string; suggestions: string[] }[] = [];
  for (const d of descriptions) {
    const f = byDesc.get(normalize(d));
    if (f) found.set(d, f);
    else
      missing.push({
        description: d,
        suggestions: allDescriptions
          .map((c) => ({ c, s: similarity(d, c) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, 5)
          .map((x) => x.c),
      });
  }
  return { found, missing };
}

/** Required macronutrients must be present for a food to be usable. */
export function missingRequiredNutrients(f: FdcFood): NutrientKey[] {
  return (["kcal", "protein_g", "fat_g", "carbs_g"] as const).filter((k) => f.nutrients[k] === undefined);
}
