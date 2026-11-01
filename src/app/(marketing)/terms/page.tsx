import type { Metadata } from "next";
import Link from "next/link";
import { LegalDraftNotice } from "@/components/legal-draft";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use ChopPlanner.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="container-page prose-page max-w-3xl py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Terms of Service</h1>
      <LegalDraftNotice />
      <h2>Eligibility</h2>
      <p>You must be 18 or older to create an account.</p>
      <h2>Not medical advice</h2>
      <p>
        ChopPlanner provides general nutrition information and estimates. It is not a substitute for advice from a doctor,
        registered dietitian or other qualified professional. See our <Link href="/nutrition-disclaimer">Nutrition Disclaimer</Link>.
      </p>
      <h2>Allergies</h2>
      <p>
        We filter recipes based on the allergies you tell us about, but we can&apos;t guarantee that food products are free of
        allergens or cross-contamination. Always check ingredient labels.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our
        orders, handles payments, sales tax and VAT, and provides customer service for billing enquiries and returns. Paid
        plans renew automatically until cancelled. You can cancel at any time from Plan &amp; billing in your account, and you
        keep Premium access until the end of the period you paid for.
      </p>
      <h2>Acceptable use</h2>
      <p>Don&apos;t misuse the service, attempt to access other users&apos; data, or try to bypass usage limits.</p>
      <h2>Changes</h2>
      <p>We&apos;ll tell you about material changes to these terms before they take effect.</p>
    </article>
  );
}
