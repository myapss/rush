"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, onboardingSchema } from "@/lib/validation/onboarding";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string>;
      /** Submitted values, so the form can be re-filled after React resets it. */
      values?: Record<string, unknown>;
      attempt?: number;
    };

export async function saveProfile(mode: "onboarding" | "settings", _prev: ProfileFormState, fd: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const raw = formDataToObject(fd);
  const parsed = onboardingSchema(new Date().getUTCFullYear()).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors, values: raw, attempt: Date.now() };
  }
  const { profile, preferences, healthConsent } = parsed.data;
  const supabase = await createClient();

  const { data: current, error: loadError } = await supabase
    .from("profiles")
    .select("health_data_consent_at, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  if (loadError) return { status: "error", message: "We couldn't save your profile. Please try again.", fieldErrors: {} };

  const now = new Date().toISOString();
  // Withdrawing consent clears the health fields (the schema already nulls them).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      ...profile,
      health_data_consent_at: healthConsent ? (current.health_data_consent_at ?? now) : null,
      onboarding_completed_at: current.onboarding_completed_at ?? now,
    })
    .eq("id", user.id);
  if (profileError) {
    console.error("profile update failed", profileError.message);
    return { status: "error", message: "We couldn't save your profile. Please try again.", fieldErrors: {} };
  }

  const { error: prefsError } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, ...preferences }, { onConflict: "user_id" });
  if (prefsError) {
    console.error("preferences upsert failed", prefsError.message);
    return { status: "error", message: "We couldn't save your preferences. Please try again.", fieldErrors: {} };
  }

  if (mode === "onboarding") redirect("/dashboard");
  return { status: "saved" };
}

export type DeleteState = { status: "idle" } | { status: "error"; message: string };

export async function deleteAccount(_prev: DeleteState, fd: FormData): Promise<DeleteState> {
  const user = await requireUser("/dashboard/settings");
  if (fd.get("confirm") !== "DELETE") return { status: "error", message: 'Type DELETE to confirm.' };

  // Removing the auth user cascades to every table holding the user's data.
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account deletion failed", error.message);
    return { status: "error", message: "We couldn't delete your account. Please try again or contact support." };
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
