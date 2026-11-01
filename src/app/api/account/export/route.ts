import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

/** Downloads all of the signed-in user's data as JSON (RLS limits every query to their rows). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await rateLimit(`export:${user.id}`, 10, 3600))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const tables = [
    "profiles",
    "user_preferences",
    "meal_plans",
    "planned_meals",
    "grocery_lists",
    "grocery_items",
    "progress_entries",
    "subscriptions",
    "ai_events",
  ] as const;
  const recipes = supabase.from("recipes").select("*, recipe_ingredients(*)").eq("created_by", user.id);
  const results = await Promise.all([...tables.map((t) => supabase.from(t).select("*")), recipes]);

  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    ...Object.fromEntries(tables.map((t, i) => [t, results[i].data])),
    recipes: results[tables.length].data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="chopplanner-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
