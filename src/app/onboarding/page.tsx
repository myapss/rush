import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { toProfileDefaults } from "@/lib/data/profile-defaults";
import { countryOptions } from "@/lib/reference";

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false, follow: false } };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="container-page flex min-h-16 items-center">
          <Link href="/" className="text-lg font-extrabold">
            <span aria-hidden>🥗</span> NutriPlan <span className="text-brand">AI</span>
          </Link>
        </div>
      </header>
      <main id="main" className="container-page max-w-3xl py-10">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Let&apos;s personalize your plans</h1>
        <p className="mb-8 text-muted">
          This takes about two minutes. You can change anything later in Settings.
        </p>
        <Suspense fallback={<div className="card h-96" aria-busy />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}

async function Onboarding() {
  const user = await requireUser("/onboarding");
  const { profile, preferences } = await getProfileAndPreferences(user.id);
  return <ProfileForm mode="onboarding" defaults={toProfileDefaults(profile, preferences)} countries={countryOptions()} />;
}
