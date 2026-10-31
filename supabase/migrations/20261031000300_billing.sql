-- Phase 3: Paddle billing.

alter table public.subscriptions add column price_id text;
alter table public.subscriptions add column currency char(3) check (currency ~ '^[A-Z]{3}$');
-- When the provider says the event happened; older events are ignored so
-- out-of-order webhook deliveries can't roll the state back.
alter table public.subscriptions add column last_event_at timestamptz;
create index subscriptions_customer on public.subscriptions (provider, provider_customer_id);

-- Webhook payloads are kept for auditing and debugging, then pruned.
alter table public.billing_events add column processed_at timestamptz;
create index billing_events_received on public.billing_events (received_at);

-- Paused subscriptions don't grant Premium; past_due keeps access while the
-- provider retries payment; a canceled subscription keeps access until the end
-- of the period that was paid for.
create or replace function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (s.status in ('active', 'trialing', 'past_due')
           or (s.status = 'canceled' and s.current_period_end > now()))
  )
$$;
revoke execute on function public.is_premium(uuid) from public, anon, authenticated;
grant execute on function public.is_premium(uuid) to service_role;

-- Let the signed-in user check their own tier (used by the billing page).
create function public.my_tier() returns text
language sql stable security definer set search_path = '' as $$
  select case when public.is_premium((select auth.uid())) then 'premium' else 'free' end
$$;
revoke execute on function public.my_tier() from public, anon;
grant execute on function public.my_tier() to authenticated;
