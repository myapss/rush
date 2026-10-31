import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Preferences = Database["public"]["Tables"]["user_preferences"]["Row"];

export async function getProfileAndPreferences(userId: string) {
  const supabase = await createClient();
  const [profile, prefs] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile.error) throw new Error(`Could not load profile: ${profile.error.message}`);
  if (prefs.error) throw new Error(`Could not load preferences: ${prefs.error.message}`);
  return { profile: profile.data, preferences: prefs.data };
}
