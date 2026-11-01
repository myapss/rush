import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free ChopPlanner account to save your preferences and plan meals.",
  alternates: { canonical: "/signup" },
};

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function Page({ searchParams }: PageProps<"/signup">) {
  return (
    <div className="container-page max-w-md py-12 sm:py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Create your free account</h1>
      <p className="mb-6 text-muted">Save your preferences and targets. It takes about two minutes. No password needed.</p>
      <Suspense fallback={<div className="card h-56" />}>
        <FormWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-brand underline">Log in</Link>
      </p>
    </div>
  );
}

async function FormWithParams({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/dashboard");
  const error = typeof sp.error === "string" ? sp.error : undefined;
  return (
    <>
      {error && (
        <p role="alert" className="notice mb-4">
          That sign-in link is invalid or has expired. Please request a new one.
        </p>
      )}
      <AuthForm mode="signup" next={next} googleEnabled={googleEnabled} />
    </>
  );
}
