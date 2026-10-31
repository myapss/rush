import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

/** Service-role client for trusted scripts. Reads env from --env-file. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (e.g. run with --env-file=.env.local).");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
