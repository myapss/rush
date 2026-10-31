import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteAccount } from "@/components/delete-account";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { toProfileDefaults } from "@/lib/data/profile-defaults";
import { countryOptions } from "@/lib/reference";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="grid max-w-3xl gap-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <Suspense fallback={<div className="card h-96" aria-busy />}>
        <Settings />
      </Suspense>
      <section aria-labelledby="data-h" className="card grid gap-3">
        <h2 id="data-h" className="text-lg font-bold">
          Your data
        </h2>
        <p className="text-muted">Download a copy of everything we store about you, in JSON format.</p>
        <a href="/api/account/export" className="btn w-fit" download>
          Export my data
        </a>
      </section>
      <section aria-labelledby="delete-h" className="card grid gap-3 border-danger/40">
        <h2 id="delete-h" className="text-lg font-bold">
          Delete account
        </h2>
        <p className="text-muted">
          This permanently deletes your account, preferences, plans and progress. It can&apos;t be undone. An active
          subscription is cancelled immediately and won&apos;t renew.
        </p>
        <DeleteAccount />
      </section>
    </div>
  );
}

async function Settings() {
  const user = await requireUser("/dashboard/settings");
  const { profile, preferences } = await getProfileAndPreferences(user.id);
  return <ProfileForm mode="settings" defaults={toProfileDefaults(profile, preferences)} countries={countryOptions()} />;
}
