import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
});

let cached: z.infer<typeof serverSchema> | undefined;

/** Server-only secrets, validated on first use. */
export function serverEnv() {
  cached ??= serverSchema.parse({ SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });
  return cached;
}
