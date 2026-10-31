"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { generateRecipes } from "@/lib/recipes/generate";
import { createClient } from "@/lib/supabase/server";

export type GeneratorState =
  | { status: "idle" }
  | { status: "done"; count: number; leftOut: { input: string; food: string; reason: string }[]; unknown: string[] }
  | { status: "error"; message: string; leftOut?: { input: string; food: string; reason: string }[] };

const inputSchema = z.object({
  have: z
    .string()
    .max(400)
    .transform((s) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))].slice(0, 15)),
  mealType: z.enum(["", "breakfast", "lunch", "dinner", "snack"]).transform((v) => (v === "" ? null : v)),
  servings: z.coerce.number().int().min(1).max(6),
  maxMinutes: z.enum(["", "15", "30", "45", "60"]).transform((v) => (v === "" ? null : Number(v))),
  notes: z.string().trim().max(300).default(""),
});

export async function generateRecipeAction(_prev: GeneratorState, fd: FormData): Promise<GeneratorState> {
  const user = await requireUser("/dashboard/recipes/generate");
  const parsed = inputSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: "Please check the form and try again." };
  if (!(await rateLimit(`recipe-gen:${user.id}`, 15, 3600))) {
    return { status: "error", message: "Too many requests. Please wait a few minutes and try again." };
  }
  const r = await generateRecipes(user.id, parsed.data);
  if (!r.ok) return { status: "error", message: r.message, leftOut: r.leftOut };
  refresh();
  return { status: "done", count: r.recipeIds.length, leftOut: r.leftOut, unknown: r.unknown };
}

export async function deleteOwnRecipe(fd: FormData) {
  const user = await requireUser("/dashboard/recipes/generate");
  const id = z.uuid().safeParse(fd.get("recipeId"));
  if (id.success) {
    const supabase = await createClient();
    await supabase.from("recipes").delete().eq("id", id.data).eq("created_by", user.id);
  }
  redirect("/dashboard/recipes/generate");
}
