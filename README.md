# ChopPlanner

**ChopPlanner** (chopplanner.com) is a worldwide, subscription-based meal-planning web app. *Eat smart, wherever you are.* ("Chop" means "eat" in Nigerian and West African Pidgin.)

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS 4) and Supabase (Postgres, Auth, Row Level Security), hosted on Cloudflare Workers.

- Architecture and roadmap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Launch checklist: [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md)
- Calculation methods: [`docs/calculations.md`](docs/calculations.md)

## Status

**All five phases of the blueprint are built** (Foundation, Core product, Monetization, Quality & launch prep, Growth). See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for what's left before launch. The real food data still has to be imported, and Paddle needs to be configured (see below).

| Area | State |
|---|---|
| Public site, calculators, food database page, legal drafts, sitemap | ✅ |
| Database schema, RLS, quotas, rate limits | ✅ |
| Auth, 18+ gate, onboarding, health-data consent, export, deletion | ✅ |
| Curated foods (115) and recipe library (64 recipes, 23 cuisines) | ✅ written, **import pending** |
| USDA import scripts | ✅ (unit-tested; real import not yet run) |
| 7-day planner: AI (Claude) with validation, plus a rules fallback | ✅ |
| Meal swaps, grocery list (combine, group, tick, add, edit, delete, scale, print) | ✅ |
| Recipe browser, "ingredients I have" finder, saved recipes, recipe detail | ✅ |
| Progress tracker (weight, waist, adherence, notes, trend chart) | ✅ |
| Paddle subscriptions: checkout, verified webhooks, cancel/resume, billing portal, usage display | ✅ (tested with signed test webhooks; needs your Paddle account) |
| Free/Premium limits enforced in Postgres | ✅ |
| Error monitoring (Sentry, PII-scrubbed), error pages, `/api/health` | ✅ (needs your Sentry DSN) |
| GA4 analytics behind an opt-in cookie banner, public pages only | ✅ (needs your GA ID) |
| Accessibility checks on all pages; recipe-library safety tests; daily data-retention job | ✅ |
| SEO: 9 meal-plan landing pages + hub, 64 public recipe pages, breadcrumbs data, sitemap, real 404s | ✅ (content needs dietitian review) |
| Owner metrics: `npm run metrics` (funnel, conversion, MRR, churn, AI cost) | ✅ |
| AI recipe generator ("what's in my kitchen"), validated against allergies and USDA nutrition | ✅ (needs `ANTHROPIC_API_KEY`) |

Legal pages are **drafts** and must be reviewed by a lawyer before launch. Recipes are **not yet reviewed by a dietitian**, and the app says so.

## Loading the food data (required once)

Nutrition values come only from **USDA FoodData Central (SR Legacy)**. Nothing in this repo contains nutrition numbers except test fixtures.

1. Download **SR Legacy, CSV** from https://fdc.nal.usda.gov/download-datasets and unzip it.
2. With Supabase running and `.env.local` set:
   ```sh
   npm run import:foods -- path/to/FoodData_Central_sr_legacy_food_csv_...
   npm run import:recipes
   ```
3. `import:foods` matches each food in `data/foods.ts` by its exact USDA description. If any description doesn't match, it lists the closest USDA names and writes nothing; fix `data/foods.ts` and re-run. `import:recipes` then checks every recipe's calories per serving and flags anything implausible.

Run the same commands against your hosted Supabase project (point `.env.local` at it) before launch.

## Setting up payments (Paddle)

Paddle is the merchant of record: it charges customers in their local currency, handles VAT and sales tax worldwide, and pays out to the business. It accepts sellers based in Nigeria.

1. Create a **sandbox** account at https://sandbox-vendors.paddle.com.
2. **Catalog → Products:** create "ChopPlanner Premium" with two recurring prices: $9.99 monthly and $59.99 yearly. Copy the `pri_…` IDs into `PADDLE_PRICE_MONTHLY_ID` and `PADDLE_PRICE_YEARLY_ID`.
3. **Developer tools → Authentication:** create an API key (`PADDLE_API_KEY`) and a client-side token (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`).
4. **Developer tools → Notifications:** add a destination `https://<your-domain>/api/webhooks/paddle` subscribed to all `subscription.*` events. Copy its secret into `PADDLE_WEBHOOK_SECRET`.
5. **Checkout → Checkout settings:** set the default payment link to `https://<your-domain>/dashboard/billing`.
6. Test with Paddle's test cards in sandbox. Then complete Paddle's seller verification (business details, website review including pricing, terms, privacy and refund policy pages), switch to production values and set `PADDLE_ENVIRONMENT=production`.

How it's secured:
- The checkout transaction is created **on the server** with the user's ID attached, so the browser can't assign a subscription to someone else.
- Subscription state is written **only** by `/api/webhooks/paddle`, after verifying Paddle's HMAC signature with a 5-second replay window. Each event is processed once (`billing_events`), and older, out-of-order events are ignored.
- The "payment complete" message in the browser is only a hint; the billing page waits for the webhook before showing Premium.
- Deleting an account cancels any live subscription with Paddle first, and refuses to delete if that fails.

## How the AI recipe generator works

1. The user lists what they have. Their entries are matched to our food database, and anything excluded by their allergies, eating style, restrictions or dislikes is left out and reported back to them.
2. Claude receives only the foods that are safe for this user, as codes (`F1`, `F2` …), plus the on-hand items and any notes, which are marked as data, not instructions.
3. Every idea is validated in code (`src/lib/recipes/validate.ts`): known codes only, allergen and diet re-checks, realistic amounts and times, 2–20 ingredients, a sensible calorie range per serving. Invalid ideas are dropped, and the request is retried once with the problems listed.
4. Valid recipes are saved as **private** recipes (`origin = 'ai_generated'`). The database computes nutrition and allergens from USDA values. Recipes are labelled as AI-generated and unreviewed, and can't be made public or used in meal plans.
5. Quota: Free 3 per month, Premium 200. Failed generations don't count.

End-to-end tests run against a local mock of the Anthropic API (`tests/e2e/mock-anthropic.mjs`), so the real SDK, parsing and validation paths are exercised without network access.

## Content and SEO

- **Meal-plan pages** (`/meal-plans/*`) are written in `src/content/meal-plans.ts`. Each page has its own guidance and an example week built from the recipe library under the page's rules. `tests/unit/meal-plan-pages.test.ts` checks that every week matches what its page says (for example, the vegan week is entirely vegan, and the Indian week has exactly one meat dish).
- **Recipe pages** (`/recipes/*`) are generated from `data/recipes.ts`; nutrition appears once the USDA import has run (cached for an hour).
- To add a page: add an entry to `MEAL_PLAN_PAGES`, give it original, reviewed content, and run `npm test`. Avoid near-duplicate pages; each one should answer a different question.
- Only `BreadcrumbList` structured data is used. FAQ and Recipe rich results aren't eligible (FAQ results are limited to authoritative health sites, and Recipe results need photos), so we don't claim them.

## How meal planning works

1. Load the user's preferences and compute targets with the same safety rules as the calculators. Users under 18, users who are pregnant, and users with a history of disordered eating don't get calorie-based plans.
2. Build candidate recipes for each meal slot. SQL filters by eating style and allergens, then code re-checks **every ingredient** (`src/lib/planner/rules.ts`).
3. If `ANTHROPIC_API_KEY` is set, Claude (`claude-opus-5-5` by default, `AI_MODEL_PLANNER` to override) picks recipe *codes* through structured output. It never sees or produces nutrition numbers.
4. Code sets portions in quarter servings to hit each day's calorie target, then validates the plan: structure, allergens, eating style, calories within ±10%, protein minimum, variety. An invalid AI plan is retried once with the problems listed, and then the deterministic rules planner takes over. Plans with safety errors are never saved.
5. Nutrition is computed from USDA values and frozen on each planned meal. The grocery list is rebuilt from the plan.
6. Every AI call is logged in `ai_events` with tokens, estimated cost and latency, and counts against the monthly quota. Failed generations are refunded.

## Local development

Requirements: Node 22+, Docker (for local Supabase).

```sh
npm install
npm run db:start            # starts local Postgres, Auth, REST and Mailpit in Docker
npx supabase status -o env  # prints local URLs and keys
cp .env.example .env.local  # then fill in the values printed above:
                            #   NEXT_PUBLIC_SUPABASE_URL=<API_URL>
                            #   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
                            #   SUPABASE_SECRET_KEY=<SECRET_KEY>
npm run dev                 # http://localhost:3000
```

Sign-in emails are captured locally by **Mailpit** at http://127.0.0.1:54324. Open the email there and click the link.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest): calculations, validation, units |
| `npm run test:db` | pgTAP tests for RLS, quotas and triggers (needs local Supabase) |
| `npm run test:e2e` | Playwright tests on desktop and mobile, including the full signup flow (needs local Supabase) |
| `npm run check` | Lint + typecheck + unit tests |
| `npm run db:reset` | Recreate the local database from migrations |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` after schema changes |
| `npm run import:foods -- <dir>` / `npm run import:recipes` | Import USDA food data and the curated recipes |
| `npm run cf:build` / `npm run cf:preview` / `npm run cf:deploy` | Build, preview locally in workerd, or deploy to Cloudflare |
| `npm run metrics [-- days]` | Business metrics report (aggregate counts only; point `.env.local` at production to run it there) |

### Database changes

Add a new file in `supabase/migrations/` (never edit an applied migration), then run `npm run db:reset`, `npm run db:types` and `npm run test:db`.

## Deploying

### Supabase (hosted)

1. Create a project at https://supabase.com. Choose the region with your users' privacy requirements in mind (e.g. EU for GDPR).
2. Link and push migrations: `npx supabase link --project-ref <ref>`, then `npx supabase db push`.
3. **Authentication → URL Configuration:** set the Site URL to your domain and add `https://<your-domain>/auth/confirm` to the redirect URLs.
4. **Authentication → Email Templates:** for *Magic Link* and *Confirm signup*, use the templates in `supabase/templates/`. They link to `/auth/confirm?token_hash=…`, which the server-side login needs.
5. **Authentication → SMTP:** configure a real email provider (e.g. Resend or Postmark). Supabase's built-in sender is heavily rate-limited.
6. Optional Google sign-in: enable the Google provider in Supabase, then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.

### Cloudflare (domain, DNS, hosting, analytics, email, security)

ChopPlanner runs on **Cloudflare Workers** using the OpenNext adapter (`@opennextjs/cloudflare`). Supabase remains the database and sign-in provider.

1. **Domain:** register `chopplanner.com` with Cloudflare Registrar, or move its nameservers to Cloudflare.
2. **Login:** run `npx wrangler login` (opens your browser).
3. **Cache bucket (once):** `npx wrangler r2 bucket create chopplanner-opennext-cache`
4. **Secrets (server-only, never in files):**
   ```sh
   npx wrangler secret put SUPABASE_SECRET_KEY
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put PADDLE_API_KEY
   npx wrangler secret put PADDLE_WEBHOOK_SECRET
   npx wrangler secret put PADDLE_PRICE_MONTHLY_ID
   npx wrangler secret put PADDLE_PRICE_YEARLY_ID
   npx wrangler secret put PADDLE_ENVIRONMENT        # sandbox, then production
   npx wrangler secret put SENTRY_DSN                # optional
   ```
5. **Public build-time values** must exist when building, because Next.js bakes `NEXT_PUBLIC_*` into the site. Put them in `.env.production` locally (git-ignored), or in the build settings if you use Cloudflare's GitHub integration:
   `NEXT_PUBLIC_SITE_URL=https://chopplanner.com`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_CONTACT_EMAIL`, and optionally `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN`.
6. **Deploy:** `npm run cf:deploy`. `wrangler.jsonc` attaches the Worker to `chopplanner.com` as a custom domain, and Cloudflare issues the HTTPS certificate automatically.
7. **Automatic deploys (recommended):** in Cloudflare → Workers & Pages → `chopplanner` → Settings → Builds, connect the GitHub repo `myapss/rush`. Set the build command to `npx opennextjs-cloudflare build`, the deploy command to `npx opennextjs-cloudflare deploy`, and add the `NEXT_PUBLIC_*` values as build variables.
8. **www → apex:** add a DNS record for `www` (proxied), then a Redirect Rule: `www.chopplanner.com/*` → `https://chopplanner.com/${1}` (301).
9. **Analytics:** Cloudflare → Web Analytics → add site → copy the token into `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`. It's cookieless, so no consent banner is needed. Google Analytics remains optional and consent-gated.
10. **Email:** Cloudflare Email Routing forwards `hello@chopplanner.com` to your inbox. Sign-in emails are *sent* by Supabase, so configure a sending provider (Resend or Postmark) in Supabase → Auth → SMTP and verify the domain with the DNS records they give you (add them in Cloudflare DNS).
11. **Security:** Security → WAF → Rate limiting rules: limit `/food-database` and `/api/*` (for example, 60 requests per minute per IP). Turn on Bot Fight Mode.
12. **Supabase Auth:** set the Site URL to `https://chopplanner.com` and add `https://chopplanner.com/auth/confirm` to the redirect URLs.
13. **Paddle:** approve `chopplanner.com` as a checkout domain, and point the webhook at `https://chopplanner.com/api/webhooks/paddle`.

**Preview the Worker locally** in Cloudflare's runtime: put the same values in `.dev.vars` (git-ignored; see `.dev.vars.example`), then run `npm run cf:preview`.

Notes:
- The app uses Next.js's classic caching model. Cache Components (`cacheComponents`) hung requests in the Workers runtime, so it's off.
- Next 16 runs `proxy.ts` on the Node.js runtime; OpenNext supports this on Cloudflare but labels it experimental. It handles session refresh and redirects, and it was verified in a local workerd run.
- `global_fetch_strictly_public` blocks requests to private network addresses, so a local preview can't reach a Supabase running on `127.0.0.1`. Point `.dev.vars` at a hosted Supabase project for full local previews.

## Security model (summary)

- Every user-owned table has RLS so users can only reach their own rows. This is verified by `supabase/tests/rls.test.sql`.
- Clients cannot write subscriptions, AI usage, plan limits or food data, even if a policy were added by mistake (privileges are revoked).
- Health data (sex, height, weight, health flags) can only be stored with consent, which a database `CHECK` constraint enforces. Withdrawing consent deletes it.
- AI quotas are reserved atomically in Postgres (`consume_quota`), never in the browser.
- The service-role key is used only in `src/lib/supabase/admin.ts`, which is `server-only`.
- Private pages send `noindex` and `no-store` headers and are disallowed in `robots.txt`.

## Troubleshooting

- **"Invalid environment variables" on startup:** `.env.local` is missing or incomplete; see Local development.
- **Sign-in link says invalid or expired:** links work once and expire after 1 hour. Locally, make sure you opened the newest email in Mailpit.
- **`supabase start` fails pulling images:** Docker Hub rate limits can block pulls. Wait and retry, or log in with `docker login`.
- **`npm run test:db` can't connect:** start Supabase first (`npm run db:start`).
- **Route type errors (`PageProps` not found):** run `npm run typecheck`, which runs `next typegen` first.
- **"There aren't enough … recipes" when creating a plan:** the food and recipe import hasn't been run, or the user's restrictions leave fewer than two recipes for a meal type.
- **Plans say "Planned automatically":** `ANTHROPIC_API_KEY` isn't set, or the AI plan failed validation twice (see server logs and `ai_events`).
