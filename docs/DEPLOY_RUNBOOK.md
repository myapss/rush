# Deploy runbook: ChopPlanner → Cloudflare + Supabase

Step-by-step instructions for deploying from the owner's computer (a person or a Claude Code session running locally). Do the steps in order and stop at each **CHECK**. Never print, echo, commit or paste secrets. When a step needs a password or key, let the owner type it into the terminal prompt themselves.

Prerequisites (owner): Cloudflare account with `chopplanner.com` registered, and a Supabase project created (the owner knows its database password).

## 0. Prepare
```sh
git pull origin main
node -v          # must be 22+
npm ci
```
**CHECK:** `npm run check` passes (lint, types, unit tests).

## 1. Supabase: database
```sh
npx supabase login                       # opens the browser
npx supabase link --project-ref <ref>    # <ref> is in the project URL; owner types the DB password when prompted
npx supabase db push                     # applies supabase/migrations/*
```
**CHECK:** `npx supabase migration list` shows every local migration as applied remotely.

In the Supabase dashboard:
- Database → Extensions: make sure **pg_cron** is enabled (the retention job needs it). If `db push` failed on `create extension pg_cron`, enable it here and push again.
- Authentication → URL Configuration: Site URL `https://chopplanner.com`; Redirect URLs: add `https://chopplanner.com/auth/confirm`.
- Authentication → Email Templates: paste `supabase/templates/magic_link.html` into *Magic Link* and `supabase/templates/confirmation.html` into *Confirm signup* (subjects: "Your ChopPlanner sign-in link" / "Confirm your ChopPlanner account").
- Authentication → SMTP: set up later with Resend/Postmark (see step 6). Supabase's built-in sender only allows a few emails per hour.

## 2. Local env for build and import
Create `.env.production.local` (git-ignored) with values from Supabase → Project Settings → API Keys:
```
NEXT_PUBLIC_SITE_URL=https://chopplanner.com
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
NEXT_PUBLIC_CONTACT_EMAIL=hello@chopplanner.com
SUPABASE_SECRET_KEY=<secret key>
```
The owner pastes the keys into the file in their editor. Don't display the file's contents afterwards.

## 3. Food data (USDA) and recipes
1. Download **SR Legacy, CSV** from https://fdc.nal.usda.gov/download-datasets and unzip it (e.g. `~/Downloads/FoodData_Central_sr_legacy_food_csv_2018-04`).
2. Run:
```sh
npx tsx --env-file=.env.production.local scripts/import-fdc.ts ~/Downloads/FoodData_Central_sr_legacy_food_csv_2018-04
npx tsx --env-file=.env.production.local scripts/import-recipes.ts
```
**CHECK:** both report success. If `import-fdc` lists descriptions it can't find, fix the `fdc` strings in `data/foods.ts` using the closest matches it prints (choose the same food and preparation), re-run, and commit the fix with a clear message. If `import-recipes` flags implausible calories, report which recipes and stop for the owner to decide.

## 4. Cloudflare: Worker
```sh
npx wrangler login                                            # opens the browser
npx wrangler r2 bucket create chopplanner-opennext-cache
npx wrangler secret put SUPABASE_SECRET_KEY                   # owner pastes the value at the prompt
npx wrangler secret put ANTHROPIC_API_KEY                     # optional: enables AI plans and recipes
```
Payments (only when Paddle is ready; otherwise skip; the site shows Premium as unavailable):
```sh
npx wrangler secret put PADDLE_ENVIRONMENT        # sandbox or production
npx wrangler secret put PADDLE_API_KEY
npx wrangler secret put PADDLE_WEBHOOK_SECRET
npx wrangler secret put PADDLE_PRICE_MONTHLY_ID
npx wrangler secret put PADDLE_PRICE_YEARLY_ID
```
(and add `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` to `.env.production.local` before building).

Deploy:
```sh
npm run cf:deploy
```
Next.js reads `.env.production.local` during the build, so the public values get baked in.

**CHECK:**
- `curl -s https://chopplanner.com/api/health` → `{"ok":true,"db":"up",...}`
- https://chopplanner.com loads; `/recipes/jollof-rice-chicken` shows nutrition numbers.
- Sign up with a real email works end to end (after SMTP is set; before that, the built-in sender may rate-limit).

## 5. Cloudflare dashboard
- DNS: add `www` as a proxied CNAME to `chopplanner.com`. Rules → Redirect Rules: `www.chopplanner.com/*` → `https://chopplanner.com/${1}`, 301.
- Web Analytics: add the site, copy the token into `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` in `.env.production.local`, and redeploy (`npm run cf:deploy`).
- Security → WAF → Rate limiting rules: path starts with `/food-database` or `/api/` → 60 requests/minute per IP → Block. Security → Bots: Bot Fight Mode on.
- Email → Email Routing: route `hello@chopplanner.com` to the owner's inbox.
- Workers & Pages → chopplanner → Settings → Builds (optional): connect GitHub `myapss/rush`, build `npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy`, and add the `NEXT_PUBLIC_*` values as build variables. After that, each push to `main` deploys automatically.

## 6. Sign-in emails (SMTP)
Create a Resend (or Postmark) account, add the domain `chopplanner.com`, and add the DNS records it shows in Cloudflare DNS. Then in Supabase → Authentication → SMTP, enter the host, port, username and password (owner types the password), with sender `ChopPlanner <hello@chopplanner.com>`.

## 7. After launch
- Google Search Console: verify the domain (DNS TXT record in Cloudflare), submit `https://chopplanner.com/sitemap.xml`.
- Uptime monitor on `https://chopplanner.com/api/health`.
- Work through the rest of `docs/LAUNCH_CHECKLIST.md` (legal review, dietitian review, Paddle verification).
