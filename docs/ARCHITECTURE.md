# NutriPlan AI: Architecture Proposal (Draft for Approval)

Status: **approved**. Phases 1–3 are built (payments via Paddle); the USDA import and Paddle account setup are pending. See the README for current status.

## 0. What's in the repository now

| Item | State |
|---|---|
| Branch | `main`, 1 commit (`43240dd Add diet planner website`) |
| Code | Static site: `index.html`, `styles.css`, `app.js`, `meals.js`, `README.md` |
| Reusable | Mifflin-St Jeor calculator logic, form UX, guardrail ideas (adult-only, calorie floors) |
| Not reusable as is | `meals.js`: its ~50 meals use **hand-estimated nutrition with no source**, which breaks principle 2. It will be retired and rebuilt from sourced data. |
| Tooling in this environment | Node 22, npm, pnpm, Docker, psql (enough to run Supabase locally and test RLS) |

**Proposal:** replace the static site with a Next.js app in the same repo. Port the calculator logic into a tested `lib/nutrition` module, then delete the old files.

## 1. Architecture

```
Browser (Next.js RSC + client components, Tailwind)
   │  HTTPS
Next.js on Vercel ── server actions / route handlers (zod-validated)
   │        │                 │                   │
   │   Supabase Postgres   Anthropic API     Billing provider
   │   (Auth, RLS,         (server only,     (Paddle or Stripe;
   │    migrations)         structured        verified webhooks)
   │                        tool output)
   └── USDA FDC bulk data imported via script into food_items (no runtime dependency)
```

Key design decisions:

1. **The AI never produces nutrition numbers.** The planner sends the model a candidate list of *pre-validated recipe IDs* (already filtered for allergens, diet and dislikes) plus the targets. The model returns `{day, meal_type, recipe_id, servings}` via a strict tool schema, and deterministic code computes all nutrition from `food_items`.
2. **Defense in depth on restrictions.** Allergens are filtered (a) in the SQL candidate query, (b) again in the validator after the AI responds, and (c) a third time when rendering. Recipe allergen tags are *derived* from ingredient allergen flags, not hand-entered.
3. **Validation loop.** Plans are rejected if any meal is outside the candidate set, a day's calories fall outside ±10% of target, protein is below the minimum, or the structure is invalid. The system retries up to 2 times, then falls back to a deterministic greedy planner, so users always get a valid plan and are never shown an invalid one.
4. **Recipe generator** (from user ingredients): the model proposes a recipe whose ingredients **must map to `food_items` IDs**, and unmapped ingredients are rejected or flagged. Nutrition is computed, never accepted from the model. Output is labelled "AI-generated, not reviewed by a dietitian".
5. **Entitlements and quotas are enforced in Postgres** with an atomic `consume_quota(feature)` SECURITY DEFINER function called from the server. The browser only displays remaining usage.
6. **Billing is behind a provider interface** (`lib/billing/provider.ts`), so the Paddle-vs-Stripe decision doesn't leak into the app. Subscription rows are written **only** by the verified webhook handler using the service role.
7. **Rate limiting** starts Postgres-backed (a fixed-window table), so there's no extra vendor at MVP. Moving to Redis is possible if traffic needs it.
8. **i18n-ready:** `next-intl` with English only at launch. Units are converted in `lib/units`, currency is formatted with `Intl.NumberFormat`, and all copy goes in message files.

### Safety guardrails (deterministic, in `lib/nutrition/safety.ts`)

- Under 18: **no calorie targets or weight-loss plans**. Show general healthy-eating guidance and "talk to a doctor or dietitian". Accounts require 18+.
- Pregnancy/breastfeeding, eating-disorder history, or a medical condition (optional, self-declared): no deficit plans, maintenance-only estimate, prominent advice to see a professional.
- BMI < 18.5: weight-loss goal disabled.
- Deficit capped at 20% of TDEE (and ≤ 500 kcal), surplus at 15%. Hard floors: 1,200 kcal (female) / 1,500 kcal (male).
- Free-text inputs (likes, dislikes, notes) are passed to the model as **data**, never as instructions. Safety rules and restrictions live in code, not in the prompt.

## 2. Folder structure

```
src/
  app/
    (marketing)/            # public, indexable
      page.tsx              # homepage
      pricing/ about/ contact/ privacy/ terms/ nutrition-disclaimer/
      calorie-calculator/ tdee-calculator/ protein-calculator/ bmi-calculator/
      meal-planner/ recipe-generator/ food-database/
      meal-plans/[slug]/    # curated, distinct content per slug (no thin pages)
      blog/[slug]/
    (auth)/login/ signup/ auth/callback/
    dashboard/              # noindex via metadata + robots.txt
      layout.tsx            # auth gate
      page.tsx my-meals/ grocery-list/ recipes/ progress/ settings/ billing/
    api/
      webhooks/billing/route.ts
      ai/plan/route.ts  ai/recipe/route.ts  ai/substitute/route.ts
    sitemap.ts  robots.ts
  components/               # ui/ (primitives), forms/, charts/, marketing/
  lib/
    nutrition/              # bmr.ts targets.ts macros.ts safety.ts  (pure + unit tested)
    units/                  # metric/imperial, ingredient unit conversion
    planner/                # candidates.ts prompt.ts schema.ts validate.ts fallback.ts
    grocery/                # merge + sum compatible units + categorize
    ai/                     # anthropic client, timeouts, retries, token/cost logging
    billing/                # provider.ts + paddle.ts | stripe.ts
    supabase/               # server.ts client.ts admin.ts (server-only import guard)
    entitlements.ts  rate-limit.ts  env.ts (zod-validated env)
  messages/en.json
supabase/
  migrations/               # SQL, one per change
  seed.sql                  # dev-only seed (clearly marked)
  tests/                    # pgTAP RLS tests
scripts/
  import-fdc.ts             # USDA FDC bulk CSV → food_items (+ provenance)
content/                    # MDX for meal-plan landing pages and blog
tests/
  unit/  e2e/ (Playwright)
.env.example
.github/workflows/ci.yml    # lint, typecheck, unit, pgTAP, e2e
```

## 3. Database schema (changes from the blueprint)

The blueprint's tables are kept. Additions and changes:

| Table | Change / reason |
|---|---|
| `profiles` | Add `birth_year` (not full DOB, to minimize data), `sex_for_calc` (nullable; needed only for BMR), `health_flags` (jsonb, optional), `health_data_consent_at`. Weight and health flags are GDPR Art. 9 data, so explicit consent is required. |
| `user_preferences` | `unique(user_id)`, so it's 1:1. Allergies use a fixed enum array (`gluten, dairy, egg, peanut, tree_nut, soy, fish, shellfish, sesame, mustard, celery, lupin, mollusc, sulphite`), covering the EU 14 and US Big 9. |
| `food_items` | Nutrients per 100 g in typed columns (kcal, protein, carb, fat, fibre, sugar, sat_fat, sodium) plus `extra_nutrients jsonb`. Add `allergens allergen[]`, `fdc_id`, `source_name`, `source_reference`, `source_updated_at`, `license`. GIN trigram index on name/aliases for search. |
| `food_portions` | **New.** Household measures (`1 cup = 158 g`) from FDC, used for unit conversion. |
| `recipes` | Add `allergen_tags` (**derived** by trigger from ingredients), `nutrition_per_serving` (computed cache), `origin` (`curated` / `ai_generated` / `user`), `review_status`, `cost_tier`. |
| `planned_meals` | `nutrition_snapshot jsonb` kept, so the plan stays stable if the DB is corrected later. |
| `ai_usage` → `ai_events` | Append-only log per call: `feature, model, input_tokens, output_tokens, cost_usd_est, status, latency_ms`. Quotas are counted from this table, which also gives cost monitoring. |
| `rate_limits` | **New.** Fixed-window counters. |
| `billing_events` | **New.** Webhook event IDs, for idempotency. |
| `subscriptions` | `unique(user_id)`, `cancel_at_period_end`. |

All user-owned tables have `user_id uuid references auth.users on delete cascade`, so deleting an account removes everything. All tables get `created_at/updated_at`, `check` constraints (e.g., `weight_kg between 20 and 400`), and indexes on FKs and `(user_id, date)`.

### RLS plan

| Table | anon | authenticated | service role |
|---|---|---|---|
| `food_items`, `food_portions` | read | read | write (import script) |
| `recipes` | read `visibility='public'` | read public + own; insert/update/delete own with `origin='user'` | all |
| `recipe_ingredients` | follows parent recipe | follows parent recipe | all |
| `profiles`, `user_preferences`, `progress_entries`, `meal_plans`, `grocery_lists` | none | own rows only (`user_id = auth.uid()`), full CRUD | all |
| `planned_meals`, `grocery_items` | none | via `exists` on parent owned by `auth.uid()` | all |
| `subscriptions`, `ai_events` | none | **read own only**, no writes | write |
| `rate_limits`, `billing_events` | none | none | all |

RLS is tested with **pgTAP**. For each private table: user A cannot select, update or delete user B's rows, anon gets nothing, and users can't write to subscriptions or ai_events.

## 4. Phased checklist

**Phase 1: Foundation**
- [x] Scaffold Next.js + TS (strict) + Tailwind + ESLint + Vitest + Playwright; `.env.example`; CI workflow
- [x] Port calculator to `lib/nutrition` with unit tests (Mifflin-St Jeor, documented in `docs/calculations.md`)
- [x] Supabase local setup, migrations for all tables, RLS, pgTAP tests
- [x] Auth (email magic link + Google OAuth), 18+ gate, consent capture
- [x] Onboarding and preference management
- [x] Public site shell: homepage, legal pages (drafts marked "needs legal review"), sitemap, robots

**Phase 2: Core product**
- [x] FDC import script (SR Legacy), food search page (**real import pending**: USDA domain blocked in the build environment)
- [x] Curated recipe library v1 (~55 recipes; grow toward ~120)
- [x] Planner: candidates → AI → validate → compute → save, plus fallback planner; tests with fixture model responses
- [x] Meal and ingredient substitution
- [x] Grocery list: merge, sum, categorize, check off, edit, scale, print/share
- [x] Dashboard, saved plans, progress tracker with charts and edit/delete

**Phase 3: Monetization**
- [x] Billing provider integration, verified + idempotent webhooks
- [x] Entitlements, `consume_quota`, usage display, billing/cancel page
- [x] Rate limits on auth, AI, swaps, checkout and data export (public pages are static; the food-database search is not rate-limited yet, so add CDN/WAF limits at launch)

**Phase 4: Quality and launch**
- [ ] Allergy/restriction property tests (random profiles × plans must never violate)
- [ ] Payment lifecycle tests (success, failure, cancel, renew) against provider sandbox
- [ ] Accessibility (axe) + mobile E2E; Sentry; GA4 with Consent Mode; data export/delete flows

**Phase 5: Growth**
- [ ] SEO landing pages with original reviewed content, metrics dashboard, additional locales/data sources on demand

## 5. Accounts and credentials needed (when the phase needs them, not now)

| Service | Values (go in `.env.local` / Vercel env, never in code) | Needed by |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Phase 1 deploy (local dev uses the local stack) |
| Anthropic | `ANTHROPIC_API_KEY` | Phase 2 |
| USDA FDC | `FDC_API_KEY` (free via api.data.gov; bulk CSV import needs none) | Phase 2, optional |
| Paddle **or** Stripe | API key, webhook secret, price IDs | Phase 3 |
| Vercel | account linked to GitHub repo | first deploy |
| Email (Resend/Postmark SMTP) | SMTP creds for Supabase Auth emails | before launch (Supabase's default SMTP is rate-limited) |
| Google | GA4 measurement ID, Search Console verification, OAuth client for Google sign-in | Phase 4 |
| Sentry (optional) | DSN | Phase 4 |
| Domain | DNS access | launch |

## 6. Unresolved decisions and risks

**Decisions needed from you**
1. **Country of the business / legal entity.** This determines payment provider availability and payouts. *Recommendation:* Paddle (merchant of record handles global VAT/sales tax) if supported for you, otherwise Stripe + Stripe Tax.
2. **Replace the static site** with the Next.js app? *Recommendation: yes.*
3. **Product name and domain.** "NutriPlan AI" needs trademark/domain checks.
4. **Free-tier limits.** *Suggested start:* free = 1 AI plan/month + 3 recipe generations/month; premium = 30 plans + 200 recipes + unlimited swaps (soft cap 300/month).
5. **Launch cuisines.** *Suggested:* American, British, Nigerian, Indian, Mexican, Mediterranean/Italian, Chinese, Japanese.
6. **Recipe review.** Will a registered dietitian review the curated library? Strongly recommended before making nutrition claims publicly.

**Risks**
- **Regional nutrition data licensing:** USDA FDC is public domain (CC0). Other sources need license checks before import: UK CoFID, India IFCT 2017 (NIN, restrictive), and FAO/INFOODS West Africa 2019 for Nigerian foods. Until those are cleared, regional dishes are built from FDC ingredient-level data, with provenance shown.
- **Health data (GDPR Art. 9 / similar laws):** needs explicit consent, DPAs with Supabase/Vercel/Anthropic, data-region choice (EU vs US Supabase project), retention policy, and legal review. We will not claim compliance without that review.
- **AI cost and latency:** plan generation is the costliest call. Mitigations: small candidate lists, a cheaper model for swaps, cached prompt prefixes, per-call token logging, timeout + deterministic fallback. Real per-plan cost is measured in Phase 2 before pricing is finalized.
- **Recipe library size** limits plan variety. Curating ~120 good recipes is real content work.
- **Unit conversion** (cups ↔ grams) depends on FDC portion data, so some ingredients will lack conversions and fall back to grams.
- **Minors and vulnerable users:** guardrails reduce risk but can't eliminate it, so clear disclaimers and professional-referral copy are required.
