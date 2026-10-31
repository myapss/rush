import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to NutriPlan AI with a secure email link.",
  alternates: { canonical: "/login" },
};

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <div className="container-page max-w-md py-12 sm:py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mb-6 text-muted">We&apos;ll email you a secure sign-in link. No password needed.</p>
      <Suspense fallback={<div className="card h-56" />}>
        <FormWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account? <Link href="/signup" className="font-semibold text-brand underline">Sign up</Link>
      </p>
    </div>
  );
}

async function FormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
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
      <AuthForm mode="login" next={next} googleEnabled={googleEnabled} />
    </>
  );
}
