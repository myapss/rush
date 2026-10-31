-- Row Level Security tests. Run with: npm run test:db
begin;
create extension if not exists pgtap with schema extensions;
select plan(59);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test', 'authenticated', 'authenticated');

select is((select count(*)::int from public.profiles where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')),
  2, 'profile row created for each new user');

update public.profiles set health_data_consent_at = now(), weight_kg = 70
  where id = '11111111-1111-1111-1111-111111111111';
insert into public.user_preferences (user_id) values
  ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
insert into public.meal_plans (id, user_id, title, goal, start_date, end_date) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A plan', 'maintain', '2026-11-02', '2026-11-08'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B plan', 'maintain', '2026-11-02', '2026-11-08');
insert into public.planned_meals (meal_plan_id, date, meal_type, recipe_title, servings, nutrition_snapshot) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '2026-11-02', 'lunch', 'B lunch', 1, '{}');
insert into public.grocery_lists (id, user_id, title) values
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'B list');
insert into public.grocery_items (grocery_list_id, name) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Rice');
insert into public.progress_entries (user_id, entry_date, weight_kg) values
  ('22222222-2222-2222-2222-222222222222', '2026-11-01', 80);
insert into public.subscriptions (user_id, provider, provider_customer_id, provider_subscription_id, status, plan) values
  ('22222222-2222-2222-2222-222222222222', 'paddle', 'cus_b', 'sub_b', 'active', 'premium_monthly');
insert into public.ai_events (user_id, feature, status) values
  ('22222222-2222-2222-2222-222222222222', 'meal_plan', 'ok');
insert into public.food_items (name, category, kcal, protein_g, carbs_g, fat_g, dietary_pattern, allergens,
  source_name, source_reference, source_updated_at, license) values
  ('Test oats', 'grains', 380, 13, 67, 7, 'vegan', '{gluten}', 'Test', 'test:1', '2026-01-01', 'CC0'),
  ('Test milk', 'dairy', 61, 3.2, 4.8, 3.3, 'vegetarian', '{dairy}', 'Test', 'test:2', '2026-01-01', 'CC0');
insert into public.recipes (id, title, servings, origin, visibility) values
  ('cccccccc-0000-0000-0000-000000000001', 'Public porridge', 1, 'curated', 'public');
insert into public.recipe_ingredients (recipe_id, food_item_id, quantity, unit, grams)
  select 'cccccccc-0000-0000-0000-000000000001', id, 1, 'portion', case name when 'Test oats' then 50 else 200 end
  from public.food_items;
insert into public.recipes (id, title, servings, origin, visibility, created_by) values
  ('bbbbbbbb-0000-0000-0000-000000000003', 'B private', 1, 'user', 'private', '22222222-2222-2222-2222-222222222222');

-- Derived recipe fields come from ingredients.
select is((select dietary_pattern::text from public.recipes where id = 'cccccccc-0000-0000-0000-000000000001'),
  'vegetarian', 'recipe diet pattern derived from ingredients');
select is((select allergen_tags::text from public.recipes where id = 'cccccccc-0000-0000-0000-000000000001'),
  '{gluten,dairy}', 'recipe allergens derived from ingredients');
select is((select (nutrition_per_serving->>'kcal')::int from public.recipes where id = 'cccccccc-0000-0000-0000-000000000001'),
  312, 'recipe nutrition computed from food data (50 g oats + 200 g milk)');

-- Health data requires consent.
select throws_ok(
  $$update public.profiles set weight_kg = 80 where id = '22222222-2222-2222-2222-222222222222'$$,
  '23514', null, 'health data cannot be stored without consent');

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------
set local role anon;
select is((select count(*)::int from public.profiles), 0, 'anon: no profiles');
select is((select count(*)::int from public.meal_plans), 0, 'anon: no meal plans');
select is((select count(*)::int from public.progress_entries), 0, 'anon: no progress');
select is((select count(*)::int from public.subscriptions), 0, 'anon: no subscriptions');
select is((select count(*)::int from public.food_items), 2, 'anon: can read food data');
select is((select count(*)::int from public.recipes), 1, 'anon: sees only public recipes');
select is((select count(*)::int from public.recipe_ingredients), 2, 'anon: sees ingredients of public recipes');
select throws_ok($$insert into public.food_items (name, category, kcal, protein_g, carbs_g, fat_g, dietary_pattern,
  source_name, source_reference, source_updated_at, license) values ('x','x',1,1,1,1,'vegan','x','x','2026-01-01','x')$$,
  '42501', null, 'anon: cannot write food data');
reset role;

-- ---------------------------------------------------------------------------
-- User A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'A: sees only own profile');
select is((select count(*)::int from public.user_preferences), 1, 'A: sees only own preferences');
select is((select count(*)::int from public.meal_plans), 1, 'A: sees only own meal plans');
select is((select count(*)::int from public.planned_meals), 0, 'A: cannot see B planned meals');
select is((select count(*)::int from public.grocery_lists), 0, 'A: cannot see B grocery lists');
select is((select count(*)::int from public.grocery_items), 0, 'A: cannot see B grocery items');
select is((select count(*)::int from public.progress_entries), 0, 'A: cannot see B progress');
select is((select count(*)::int from public.subscriptions), 0, 'A: cannot see B subscription');
select is((select count(*)::int from public.ai_events), 0, 'A: cannot see B AI usage');
select is((select count(*)::int from public.recipes), 1, 'A: cannot see B private recipe');

-- Writes against B's data silently affect nothing.
update public.meal_plans set title = 'hacked' where user_id = '22222222-2222-2222-2222-222222222222';
delete from public.progress_entries where user_id = '22222222-2222-2222-2222-222222222222';
update public.profiles set display_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222';

select throws_ok($$insert into public.meal_plans (user_id, title, goal, start_date, end_date)
  values ('22222222-2222-2222-2222-222222222222', 'x', 'lose', '2026-11-01', '2026-11-07')$$,
  '42501', null, 'A: cannot create a plan for B');
select throws_ok($$insert into public.planned_meals (meal_plan_id, date, meal_type, recipe_title, servings, nutrition_snapshot)
  values ('bbbbbbbb-0000-0000-0000-000000000001', '2026-11-03', 'dinner', 'x', 1, '{}')$$,
  '42501', null, 'A: cannot add meals to B plan');
select throws_ok($$insert into public.grocery_items (grocery_list_id, name) values ('bbbbbbbb-0000-0000-0000-000000000002', 'x')$$,
  '42501', null, 'A: cannot add items to B list');

-- Privileged tables.
select throws_ok($$insert into public.subscriptions (user_id, provider, provider_customer_id, provider_subscription_id, status, plan)
  values ('11111111-1111-1111-1111-111111111111', 'paddle', 'c', 's', 'active', 'premium_yearly')$$,
  '42501', null, 'A: cannot grant self a subscription');
select throws_ok($$insert into public.ai_events (user_id, feature, status) values ('11111111-1111-1111-1111-111111111111', 'meal_plan', 'error')$$,
  '42501', null, 'A: cannot write AI usage directly');
select throws_ok($$update public.plan_limits set monthly_limit = 9999$$, '42501', null, 'A: cannot change plan limits');
select throws_ok($$select public.check_rate_limit('x', 1, 60)$$, '42501', null, 'A: cannot call rate limiter');
select throws_ok($$select public.is_premium('11111111-1111-1111-1111-111111111111')$$, '42501', null, 'A: cannot call is_premium directly');

-- Recipes: users may only create private user recipes.
select throws_ok($$insert into public.recipes (title, servings, origin, visibility, created_by)
  values ('x', 1, 'curated', 'public', '11111111-1111-1111-1111-111111111111')$$,
  '42501', null, 'A: cannot publish a public recipe');
select lives_ok($$insert into public.recipes (title, servings, origin, visibility, created_by)
  values ('A own', 2, 'user', 'private', '11111111-1111-1111-1111-111111111111')$$,
  'A: can create own private recipe');
update public.recipes set title = 'x' where id = 'cccccccc-0000-0000-0000-000000000001';
select is((select title from public.recipes where id = 'cccccccc-0000-0000-0000-000000000001'),
  'Public porridge', 'A: cannot edit curated recipe');

-- Progress entries need consent (A has consented).
select lives_ok($$insert into public.progress_entries (user_id, entry_date, weight_kg)
  values ('11111111-1111-1111-1111-111111111111', '2026-11-01', 70)$$, 'A: can log progress with consent');

-- Quotas: free tier gets 1 meal plan per month.
select ok(public.consume_quota('meal_plan') is not null, 'A: first free meal plan allowed');
select ok(public.consume_quota('meal_plan') is null, 'A: second free meal plan blocked');
select is((select used from public.quota_status('meal_plan')), 1, 'A: quota usage reported');
reset role;

-- ---------------------------------------------------------------------------
-- User B (premium, no health consent)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select title from public.meal_plans), 'B plan', 'B: plan untouched by A');
select is((select count(*)::int from public.progress_entries), 1, 'B: progress untouched by A');
select is((select display_name from public.profiles), null, 'B: profile untouched by A');
select throws_ok($$insert into public.progress_entries (user_id, entry_date, weight_kg)
  values ('22222222-2222-2222-2222-222222222222', '2026-11-02', 79)$$,
  '42501', null, 'B: cannot log progress without consent');
select is((select tier from public.quota_status('meal_plan')), 'premium', 'B: premium tier detected');
select ok(public.consume_quota('meal_plan') is not null, 'B: premium meal plan allowed');
reset role;

-- ---------------------------------------------------------------------------
-- Phase 2: saved recipes and one active plan per user
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select lives_ok($$insert into public.saved_recipes (user_id, recipe_id) values ('11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001')$$,
  'A: can save a public recipe');
select throws_ok($$insert into public.saved_recipes (user_id, recipe_id) values ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000003')$$,
  '42501', null, 'A: cannot save B private recipe');
select throws_ok($$insert into public.saved_recipes (user_id, recipe_id) values ('22222222-2222-2222-2222-222222222222', 'cccccccc-0000-0000-0000-000000000001')$$,
  '42501', null, 'A: cannot save recipes for B');
update public.meal_plans set status = 'active' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select throws_ok($$insert into public.meal_plans (user_id, title, goal, start_date, end_date, status)
  values ('11111111-1111-1111-1111-111111111111', 'Second', 'maintain', '2026-11-09', '2026-11-15', 'active')$$,
  '23505', null, 'A: only one active plan at a time');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.saved_recipes), 0, 'B: cannot see A saved recipes');
reset role;

-- ---------------------------------------------------------------------------
-- Phase 3: Premium entitlement rules
-- ---------------------------------------------------------------------------
select ok(public.is_premium('22222222-2222-2222-2222-222222222222'), 'active subscription is premium');
update public.subscriptions set status = 'past_due' where user_id = '22222222-2222-2222-2222-222222222222';
select ok(public.is_premium('22222222-2222-2222-2222-222222222222'), 'past_due keeps access while payment is retried');
update public.subscriptions set status = 'paused' where user_id = '22222222-2222-2222-2222-222222222222';
select ok(not public.is_premium('22222222-2222-2222-2222-222222222222'), 'paused is not premium');
update public.subscriptions set status = 'canceled', current_period_end = now() + interval '3 days' where user_id = '22222222-2222-2222-2222-222222222222';
select ok(public.is_premium('22222222-2222-2222-2222-222222222222'), 'canceled keeps access until the paid period ends');
update public.subscriptions set current_period_end = now() - interval '1 minute' where user_id = '22222222-2222-2222-2222-222222222222';
select ok(not public.is_premium('22222222-2222-2222-2222-222222222222'), 'access ends after the paid period');
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select is(public.my_tier(), 'free', 'A: my_tier reports free');
reset role;

-- ---------------------------------------------------------------------------
-- Phase 4: retention
-- ---------------------------------------------------------------------------
insert into public.billing_events (id, provider, type, payload, received_at) values
  ('evt_old', 'paddle', 'subscription.created', '{}', now() - interval '91 days'),
  ('evt_new', 'paddle', 'subscription.created', '{}', now());
insert into public.rate_limits (key, window_start, count) values ('old', now() - interval '2 days', 1);
select public.prune_old_data();
select is((select array_agg(id order by id) from public.billing_events where id in ('evt_old', 'evt_new')), array['evt_new'], 'old billing events are pruned, recent kept');
select is((select count(*)::int from public.rate_limits where key = 'old'), 0, 'old rate-limit windows are pruned');
set local role authenticated;
select throws_ok($$select public.prune_old_data()$$, '42501', null, 'users cannot run the retention job');
reset role;

-- ---------------------------------------------------------------------------
-- Account deletion cascades
-- ---------------------------------------------------------------------------
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is((select count(*)::int from public.meal_plans where user_id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.progress_entries where user_id = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.recipes where created_by = '22222222-2222-2222-2222-222222222222')
  + (select count(*)::int from public.ai_events where user_id = '22222222-2222-2222-2222-222222222222'),
  0, 'deleting a user removes all their data');

select * from finish();
rollback;
