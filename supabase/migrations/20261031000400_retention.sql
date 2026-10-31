-- Phase 4: data retention (see the Privacy Policy). Runs daily via pg_cron.

create extension if not exists pg_cron;

create function public.prune_old_data() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.billing_events where received_at < now() - interval '90 days';
  delete from public.ai_events where created_at < now() - interval '13 months';
  delete from public.rate_limits where window_start < now() - interval '1 day';
end $$;
revoke execute on function public.prune_old_data() from public, anon, authenticated;

select cron.schedule('prune-old-data', '17 3 * * *', $$select public.prune_old_data()$$);
