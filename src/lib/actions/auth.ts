"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

const emailSchema = z.email("Enter a valid email address").max(254).transform((e) => e.toLowerCase());

function confirmUrl(next: string) {
  return `${siteUrl}/auth/confirm?next=${encodeURIComponent(safeNext(next))}`;
}

async function allowed(email: string) {
  const ip = await clientIp();
  return (await rateLimit(`otp:ip:${ip}`, 20, 3600)) && (await rateLimit(`otp:email:${email}`, 5, 3600));
}

export async function sendMagicLink(mode: "login" | "signup", _prev: AuthFormState, fd: FormData): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const email = parsed.data;

  if (mode === "signup") {
    if (fd.get("ageConfirmed") !== "on")
      return { status: "error", message: "ChopPlanner is for adults. Please confirm you are 18 or older." };
    if (fd.get("termsAccepted") !== "on")
      return { status: "error", message: "Please accept the Terms and Privacy Policy to continue." };
  }

  if (!(await allowed(email))) {
    return { status: "error", message: "Too many requests. Please wait a while and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "signup",
      emailRedirectTo: confirmUrl(String(fd.get("next") ?? "/dashboard")),
      data: mode === "signup" ? { age_confirmed_at: new Date().toISOString(), terms_accepted_at: new Date().toISOString() } : undefined,
    },
  });

  // Don't reveal whether an account exists: "signups not allowed" on the
  // login form shows the same message as success.
  if (error && !(mode === "login" && /signups? not allowed|user not found/i.test(error.message))) {
    console.error("signInWithOtp failed", error.status, error.message);
    if (error.status === 429) return { status: "error", message: "Too many requests. Please wait a while and try again." };
    return { status: "error", message: "We couldn't send the email. Please try again." };
  }
  return { status: "sent", email };
}

export async function signInWithGoogle(fd: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: confirmUrl(String(fd.get("next") ?? "/dashboard")) },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}
