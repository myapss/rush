# Launch checklist

Work through this before taking real users and payments. ✅ = done in the codebase; ☐ = needs you (accounts, decisions, reviews).

## 1. Data and content
- ✅ Curated foods (115) and recipes (56 across 23 cuisines); library supports all common profiles (tested in `tests/unit/library-coverage.test.ts`)
- ☐ Download USDA SR Legacy CSV and run `npm run import:foods -- <dir>` then `npm run import:recipes` against **production** Supabase; fix any description mismatches the script reports
- ☐ Spot-check 10 recipes' calories against a second source; review flagged recipes
- ☐ Registered dietitian review of the recipe library and safety copy (then set `review_status = 'reviewed'`)
- ☐ Grow the library toward ~120 recipes, prioritising your launch markets (Nigerian, Indian, American)

## 2. Accounts and configuration (Vercel environment variables)
- ☐ Supabase production project (choose region; EU if you'll serve EU users heavily), migrations pushed (`npx supabase db push`)
- ☐ Supabase Auth: Site URL, redirect URL `https://<domain>/auth/confirm`, email templates from `supabase/templates/`, custom SMTP (Resend/Postmark)
- ☐ `pg_cron` enabled (Database → Extensions) so the daily retention job runs
- ☐ `ANTHROPIC_API_KEY` set; check `ai_events` cost per plan after the first 50 plans
- ☐ Paddle: products/prices, API key, client token, webhook destination, seller verification for your Nigerian business, switch to production values
- ☐ `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same value), alerts for new issues
- ☐ `NEXT_PUBLIC_GA_MEASUREMENT_ID`; in GA, set data retention to 2 months and turn off Google signals
- ☐ Custom domain + HTTPS (Vercel), `NEXT_PUBLIC_SITE_URL` set to it
- ☐ Uptime monitor on `https://<domain>/api/health` (e.g. Better Stack, UptimeRobot)
- ☐ Optional: Google sign-in (Supabase provider + `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`)

## 3. Legal and compliance
- ✅ Draft privacy policy (cookies, providers, retention), terms (Paddle merchant-of-record wording), nutrition disclaimer
- ✅ Health-data consent enforced in the database; consent withdrawal deletes the data
- ✅ Data export and account deletion (cancels any subscription first)
- ✅ Analytics only after opt-in, only on public pages
- ☐ Lawyer review of privacy policy and terms (GDPR Art. 9 health data, Nigeria's NDPA 2023, UK GDPR, US state laws)
- ☐ Add a refund policy page (Paddle requires one during verification)
- ☐ Data processing agreements with Supabase, Vercel, Anthropic, Sentry; publish the sub-processor list
- ☐ Fill in the contact email (`NEXT_PUBLIC_CONTACT_EMAIL`)
- ☐ Trademark and domain check for the final product name

## 4. Security
- ✅ RLS on every user table, verified by 59 database tests
- ✅ Secrets server-only; service-role key only in `server-only` modules
- ✅ Webhook signature verification, idempotency, replay window
- ✅ Rate limits on sign-in emails, plan generation, swaps, checkout, data export
- ✅ Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy); private pages `noindex` + `no-store`
- ✅ Error reports scrubbed of cookies, headers, bodies, query strings and emails
- ☐ Content-Security-Policy: needs nonces with Next.js, which makes every page dynamic. Decide after launch, or start with `Content-Security-Policy-Report-Only`
- ☐ Rate-limit or cache the public food-database search at the edge (Vercel Firewall rule)
- ☐ Enable Supabase leaked-password protection and MFA for your own Supabase, Vercel and Paddle accounts

## 5. Quality
- ✅ Unit, database and end-to-end tests run in CI on every push (`.github/workflows/ci.yml`)
- ✅ Accessibility checks (axe, WCAG 2.1 AA) on public and signed-in pages, desktop and mobile
- ✅ Allergen/diet safety tested on 200 random profiles and across the real recipe library
- ☐ First green CI run on GitHub (check the Actions tab)
- ☐ Manual test on a real Android phone and an iPhone, including Paddle checkout with test cards
- ☐ Lighthouse run on the homepage and calculators (target ≥ 90 performance on mobile)

## 6. Growth basics
- ☐ Verify the domain in Google Search Console and submit `/sitemap.xml`
- ☐ Measure activation (signup → onboarding → first plan) and free→paid conversion; the `ai_events` and `subscriptions` tables have what you need
- ☐ Write the first SEO pages (Phase 5), one at a time, each with real, reviewed content
