"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type GroceryActionState = { status: "idle" } | { status: "error"; message: string };

const id = z.uuid();

/** RLS limits every query to the signed-in user's lists. */
export async function toggleGroceryItem(itemId: string, checked: boolean) {
  await requireUser("/dashboard/grocery-list");
  if (!id.safeParse(itemId).success) return;
  const supabase = await createClient();
  await supabase.from("grocery_items").update({ checked }).eq("id", itemId);
}

export async function setHouseholdSize(fd: FormData) {
  await requireUser("/dashboard/grocery-list");
  const listId = id.safeParse(fd.get("listId"));
  const size = z.coerce.number().int().min(1).max(12).safeParse(fd.get("householdSize"));
  if (!listId.success || !size.success) return;
  const supabase = await createClient();
  await supabase.from("grocery_lists").update({ household_size: size.data }).eq("id", listId.data);
  refresh();
}

const itemSchema = z.object({
  listId: id,
  name: z.string().trim().min(1, "Enter an item name").max(120),
  quantity: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).max(100000).optional()),
  unit: z.string().trim().max(30).optional(),
});

export async function addGroceryItem(_prev: GroceryActionState, fd: FormData): Promise<GroceryActionState> {
  await requireUser("/dashboard/grocery-list");
  const parsed = itemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("grocery_items").insert({
    grocery_list_id: parsed.data.listId,
    name: parsed.data.name,
    quantity: parsed.data.quantity ?? null,
    unit: parsed.data.unit || null,
    category: "other",
    source: "manual",
    position: 10000,
  });
  if (error) return { status: "error", message: "Couldn't add that item." };
  refresh();
  return { status: "idle" };
}

export async function updateGroceryItem(fd: FormData) {
  await requireUser("/dashboard/grocery-list");
  const itemId = id.safeParse(fd.get("itemId"));
  const name = z.string().trim().min(1).max(120).safeParse(fd.get("name"));
  if (!itemId.success || !name.success) return;
  const supabase = await createClient();
  await supabase.from("grocery_items").update({ name: name.data }).eq("id", itemId.data);
  refresh();
}

export async function deleteGroceryItem(fd: FormData) {
  await requireUser("/dashboard/grocery-list");
  const itemId = id.safeParse(fd.get("itemId"));
  if (!itemId.success) return;
  const supabase = await createClient();
  await supabase.from("grocery_items").delete().eq("id", itemId.data);
  refresh();
}
