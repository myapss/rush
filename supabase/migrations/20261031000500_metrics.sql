-- Phase 5: business metrics for the owner (service role only; no user data
-- leaves the database, only aggregate counts).

create function public.metrics_summary(p_days integer default 30) returns jsonb
language sql stable security definer set search_path = '' as $$
  with
  win as (select now() - make_interval(days => p_days) as since),
  signups as (select count(*) as n from public.profiles, win where created_at >= win.since),
  onboarded as (select count(*) as n from public.profiles, win where created_at >= win.since and onboarding_completed_at is not null),
  planned as (
    select count(distinct p.id) as n from public.profiles p join public.meal_plans m on m.user_id = p.id, win
    where p.created_at >= win.since
  ),
  subs as (
    select
      count(*) filter (where status in ('active', 'trialing', 'past_due')) as active,
      count(*) filter (where status in ('active', 'trialing', 'past_due') and plan = 'premium_monthly') as monthly,
      count(*) filter (where status in ('active', 'trialing', 'past_due') and plan = 'premium_yearly') as yearly,
      count(*) filter (where status = 'past_due') as past_due,
      count(*) filter (where status = 'canceled' and updated_at >= (select since from win)) as canceled_in_window,
      count(*) filter (where cancel_at_period_end and status <> 'canceled') as cancelling
    from public.subscriptions
  ),
  ai as (
    select
      count(*) filter (where feature = 'meal_plan' and status in ('ok', 'fallback')) as plans,
      count(*) filter (where feature = 'meal_plan' and status = 'ok') as ai_plans,
      count(*) filter (where feature = 'meal_plan' and status = 'fallback') as fallback_plans,
      count(*) filter (where status = 'error') as errors,
      coalesce(sum(cost_usd_est), 0) as cost,
      count(distinct user_id) as users
    from public.ai_events, win where created_at >= win.since
  ),
  totals as (
    select (select count(*) from public.profiles) as users,
           (select count(*) from public.profiles where onboarding_completed_at is not null) as onboarded_all
  )
  select jsonb_build_object(
    'window_days', p_days,
    'users_total', totals.users,
    'funnel', jsonb_build_object(
      'signups', signups.n,
      'onboarded', onboarded.n,
      'first_plan', planned.n
    ),
    'subscriptions', jsonb_build_object(
      'active', subs.active, 'monthly', subs.monthly, 'yearly', subs.yearly, 'past_due', subs.past_due,
      'canceled_in_window', subs.canceled_in_window, 'scheduled_to_cancel', subs.cancelling,
      -- List-price estimate in USD; Paddle reports actual revenue after tax and fees.
      'mrr_usd_estimate', round(subs.monthly * 9.99 + subs.yearly * 59.99 / 12, 2),
      'paid_conversion', case when totals.onboarded_all > 0 then round(subs.active::numeric / totals.onboarded_all, 4) end,
      'churn_rate', case when subs.active + subs.canceled_in_window > 0
        then round(subs.canceled_in_window::numeric / (subs.active + subs.canceled_in_window), 4) end
    ),
    'ai', jsonb_build_object(
      'plans', ai.plans, 'ai_plans', ai.ai_plans, 'rules_fallback_plans', ai.fallback_plans, 'errors', ai.errors,
      'cost_usd', round(ai.cost, 4),
      'cost_per_ai_plan_usd', case when ai.ai_plans > 0 then round(ai.cost / ai.ai_plans, 4) end,
      'cost_per_active_user_usd', case when ai.users > 0 then round(ai.cost / ai.users, 4) end
    )
  )
  from win, signups, onboarded, planned, subs, ai, totals
$$;
revoke execute on function public.metrics_summary(integer) from public, anon, authenticated;
grant execute on function public.metrics_summary(integer) to service_role;
