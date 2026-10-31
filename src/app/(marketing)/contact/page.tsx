import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the NutriPlan AI team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const email = publicEnv.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <article className="container-page prose-page max-w-3xl py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Contact us</h1>
      {email ? (
        <p>
          Email us at <a href={`mailto:${email}`}>{email}</a>. We aim to reply within two working days.
        </p>
      ) : (
        <p>A support email address will be published here before launch.</p>
      )}
      <p>
        For data requests (access, correction or deletion), you can also export or delete your data yourself from{" "}
        <strong>Dashboard → Settings</strong>.
      </p>
      <p>
        We can&apos;t give individual medical or dietary advice. For that, please contact a doctor or registered dietitian.
      </p>
    </article>
  );
}
