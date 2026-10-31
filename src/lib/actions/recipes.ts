"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function toggleSavedRecipe(fd: FormData) {
  const user = await requireUser("/dashboard/recipes");
  const recipeId = z.uuid().safeParse(fd.get("recipeId"));
  if (!recipeId.success) return;
  const supabase = await createClient();
  if (fd.get("saved") === "true") {
    await supabase.from("saved_recipes").delete().eq("user_id", user.id).eq("recipe_id", recipeId.data);
  } else {
    await supabase.from("saved_recipes").insert({ user_id: user.id, recipe_id: recipeId.data });
  }
  refresh();
}
