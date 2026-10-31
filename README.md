# NutriPlan AI

A worldwide, subscription-based diet and meal-planning web app. *NutriPlan AI is a working name.*

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS 4) and Supabase (Postgres, Auth, Row Level Security).

- Architecture and roadmap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Calculation methods: [`docs/calculations.md`](docs/calculations.md)

## Status

**Phase 1 (Foundation) is complete.**

| Area | State |
|---|---|
| Public site: homepage, pricing, about, contact, legal drafts, sitemap, robots | ✅ |
| Calorie, TDEE, protein and BMI calculators with safety rules | ✅ |
| Database schema, RLS policies, quota and rate-limit functions | ✅ |
| Email magic-link auth (Google OAuth wired, off by default), 18+ gate | ✅ |
| Onboarding and preferences, health-data consent, data export, account deletion | ✅ |
| Food database import, recipes, AI meal planner, grocery lists | Phase 2 |
| Payments and premium entitlements | Phase 3 |
| Analytics, error monitoring, launch checks | Phase 4 |

Legal pages are **drafts** and must be reviewed by a lawyer before launch.

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

### Vercel

1. Import the GitHub repository in Vercel.
2. Add the environment variables from `.env.example`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` (mark it sensitive, Production/Preview only).
3. Deploy, then submit `https://<your-domain>/sitemap.xml` in Google Search Console.

**Never commit secrets.** `.env.local` is git-ignored; only `.env.example` (placeholders) is committed.

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
