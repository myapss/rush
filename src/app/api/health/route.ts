import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Uptime check: app is serving and the database answers. Reveals nothing else. */
export async function GET() {
  await connection();
  const started = Date.now();
  const { error } = await createAdminClient().from("plan_limits").select("tier", { head: true, count: "exact" });
  const body = { ok: !error, db: error ? "down" : "up", latency_ms: Date.now() - started };
  return NextResponse.json(body, { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
