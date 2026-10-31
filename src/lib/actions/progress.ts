"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { kgFromLb } from "@/lib/units";

export type ProgressState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

const optional = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), schema.optional());

const entrySchema = z
  .object({
    entryDate: z.iso.date("Choose a date"),
    units: z.enum(["metric", "imperial"]),
    weight: optional(z.number().positive()),
    waist: optional(z.number().positive()),
    adherence: optional(z.number().int().min(0).max(100)),
    notes: z.string().trim().max(2000).optional(),
  })
  .transform((d, ctx) => {
    const weightKg = d.weight === undefined ? null : d.units === "imperial" ? kgFromLb(d.weight) : d.weight;
    const waistCm = d.waist === undefined ? null : d.units === "imperial" ? d.waist * 2.54 : d.waist;
    if (weightKg !== null && (weightKg < 20 || weightKg > 400)) ctx.addIssue({ code: "custom", message: "Enter a realistic weight." });
    if (waistCm !== null && (waistCm < 30 || waistCm > 300)) ctx.addIssue({ code: "custom", message: "Enter a realistic waist measurement." });
    if (weightKg === null && waistCm === null && d.adherence === undefined && !d.notes)
      ctx.addIssue({ code: "custom", message: "Enter at least one value." });
    if (new Date(d.entryDate) > new Date(Date.now() + 86_400_000)) ctx.addIssue({ code: "custom", message: "The date can't be in the future." });
    return {
      entry_date: d.entryDate,
      weight_kg: weightKg === null ? null : Math.round(weightKg * 10) / 10,
      waist_cm: waistCm === null ? null : Math.round(waistCm * 10) / 10,
      adherence_pct: d.adherence ?? null,
      notes: d.notes || null,
    };
  });

export async function saveProgressEntry(_prev: ProgressState, fd: FormData): Promise<ProgressState> {
  const user = await requireUser("/dashboard/progress");
  const parsed = entrySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("progress_entries")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id,entry_date" });
  if (error) {
    // RLS rejects writes without health-data consent.
    return { status: "error", message: error.code === "42501" ? "Please give consent to store health information in Settings first." : "Couldn't save this entry." };
  }
  refresh();
  return { status: "saved" };
}

export async function deleteProgressEntry(fd: FormData) {
  await requireUser("/dashboard/progress");
  const entryId = z.uuid().safeParse(fd.get("entryId"));
  if (!entryId.success) return;
  const supabase = await createClient();
  await supabase.from("progress_entries").delete().eq("id", entryId.data);
  refresh();
}
