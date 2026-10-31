import type { Metadata } from "next";
import { LegalDraftNotice } from "@/components/legal-draft";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NutriPlan AI collects, uses and protects your personal and health information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="container-page prose-page max-w-3xl py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">Privacy Policy</h1>
      <LegalDraftNotice />
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your email address and sign-in records.</li>
        <li><strong>Profile and preferences:</strong> country, currency, units, birth year, goal, activity level, eating style, allergies, food likes and dislikes, cuisines, cooking preferences and optional budget.</li>
        <li><strong>Health information (optional, with consent):</strong> sex for the energy equation, height, weight, progress measurements, and whether you are pregnant or breastfeeding, have a history of disordered eating, or have a relevant medical condition.</li>
        <li><strong>Usage data:</strong> records of AI features you use (for quotas and cost monitoring) and basic technical logs.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>
        To provide your calorie estimates and meal plans, keep recommendations safe, enforce plan limits, secure the service
        and, with your permission, understand how the product is used. We do not sell your personal data, and we do not use
        your health information for advertising.
      </p>
      <h2>Health information and consent</h2>
      <p>
        Body measurements and health flags are only stored after you give explicit consent. You can withdraw consent in
        Settings at any time, which deletes that information.
      </p>
      <h2 id="cookies">Cookies</h2>
      <ul>
        <li><strong>Essential:</strong> sign-in session cookies, needed to keep you logged in. These are always on.</li>
        <li>
          <strong>Analytics (optional):</strong> Google Analytics 4 cookies (<code>_ga</code>, <code>_ga_*</code>), only on our
          public pages and only if you click &quot;Accept analytics&quot;. Google signals and advertising features are off. You
          can change your choice with &quot;Cookie settings&quot; in the footer.
        </li>
        <li><strong>Payments:</strong> Paddle sets its own cookies inside the checkout window when you buy Premium.</li>
      </ul>
      <h2>Service providers</h2>
      <p>We use these providers to run the service. Each receives only what it needs:</p>
      <ul>
        <li><strong>Supabase:</strong> database and sign-in (stores your account, preferences, plans and progress).</li>
        <li><strong>Vercel:</strong> website hosting.</li>
        <li><strong>Anthropic:</strong> AI meal-plan assembly. It receives your food preferences, your daily calorie and protein targets, and candidate recipe names, but never your name, email, weight, measurements or health conditions.</li>
        <li><strong>Paddle:</strong> our reseller and merchant of record for payments, tax and invoices.</li>
        <li><strong>Sentry:</strong> error monitoring. Reports are stripped of cookies, request contents and personal details.</li>
        <li><strong>Google Analytics:</strong> only with your consent, as described above.</li>
        <li><strong>Email provider:</strong> delivers sign-in links.</li>
      </ul>
      <h2>Your rights</h2>
      <p>
        You can access and export your data (Settings → Export my data), correct it (Settings), and delete your account and
        all associated data (Settings → Delete account). Depending on where you live, you may have further rights under laws
        such as the GDPR.
      </p>
      <h2>Retention</h2>
      <ul>
        <li>Account, preferences, plans, recipes and progress: while your account is active.</li>
        <li>Records of AI feature use (for limits and cost monitoring): 13 months.</li>
        <li>Payment notifications from Paddle: 90 days (Paddle keeps the financial records it is legally required to).</li>
        <li>Rate-limit counters: 1 day.</li>
      </ul>
      <p>
        When you delete your account, your data is deleted from our database immediately and from backups within the backup
        retention period.
      </p>
      <h2>Age</h2>
      <p>NutriPlan AI is intended for adults aged 18 and over.</p>
    </article>
  );
}
