/**
 * Business metrics report (aggregate counts only).
 *   npm run metrics            # last 30 days
 *   npm run metrics -- 7       # last 7 days
 * Organic visitors and calculator usage live in Google Analytics.
 */
import { adminClient } from "./lib/admin";

type Summary = {
  window_days: number;
  users_total: number;
  funnel: { signups: number; onboarded: number; first_plan: number };
  subscriptions: Record<string, number | null>;
  ai: Record<string, number | null>;
};

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "–");
const rate = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${(v * 100).toFixed(1)}%`);
const usd = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `$${Number(v).toFixed(2)}`);

async function main() {
  const days = Number(process.argv[2] ?? 30);
  const { data, error } = await adminClient().rpc("metrics_summary", { p_days: days });
  if (error) throw error;
  const m = data as unknown as Summary;
  const f = m.funnel;
  const s = m.subscriptions;
  const a = m.ai;
  console.log(`NutriPlan AI metrics: last ${m.window_days} days (total users: ${m.users_total})

Activation funnel (users who signed up in the window)
  Signed up            ${f.signups}
  Finished onboarding  ${f.onboarded}  (${pct(f.onboarded, f.signups)})
  Created a plan       ${f.first_plan}  (${pct(f.first_plan, f.signups)})

Subscriptions (now)
  Active Premium       ${s.active}  (monthly ${s.monthly}, yearly ${s.yearly}; ${s.past_due} past due)
  Scheduled to cancel  ${s.scheduled_to_cancel}
  Cancelled in window  ${s.canceled_in_window}
  MRR estimate         ${usd(s.mrr_usd_estimate)} (list price, before tax and Paddle fees)
  Free → paid          ${rate(s.paid_conversion)} of onboarded users
  Churn                ${rate(s.churn_rate)}

AI usage (window)
  Plans generated      ${a.plans}  (AI ${a.ai_plans}, rules fallback ${a.rules_fallback_plans}; ${a.errors} errors refunded)
  AI cost              ${usd(a.cost_usd)}  (${usd(a.cost_per_ai_plan_usd)} per AI plan, ${usd(a.cost_per_active_user_usd)} per active user)
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
