-- NutriPlan AI: initial schema.
-- Every user-owned table references auth.users with ON DELETE CASCADE so that
-- deleting an account removes all of that user's data.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- EU 14 + US Big 9 allergen groups.
create type public.allergen as enum (
  'gluten', 'dairy', 'egg', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish',
  'sesame', 'mustard', 'celery', 'lupin', 'mollusc', 'sulphite'
);
-- Non-allergen exclusions (religious, cultural, personal).
create type public.food_restriction as enum ('pork', 'beef', 'alcohol');
-- Ordered from most to least restrictive: max() over ingredients gives the
-- most restrictive pattern a recipe still satisfies.
create type public.dietary_pattern as enum ('vegan', 'vegetarian', 'pescatarian', 'omnivore');
create type public.goal as enum ('lose', 'maintain', 'gain', 'healthier');
create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'very_active', 'athlete');
create type public.measurement_unit as enum ('metric', 'imperial');
create type public.sex_for_calc as enum ('female', 'male', 'unspecified');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.recipe_origin as enum ('curated', 'ai_generated', 'user');
create type public.recipe_visibility as enum ('public', 'private');
create type public.plan_status as enum ('draft', 'active', 'archived');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled', 'incomplete');
create type public.billing_plan as enum ('premium_monthly', 'premium_yearly');
create type public.billing_provider as enum ('paddle', 'stripe');
create type public.ai_feature as enum ('meal_plan', 'recipe', 'substitution');
create type public.ai_event_status as enum ('pending', 'ok', 'fallback', 'invalid', 'error');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Bounded free-text arrays (likes, dislikes, cuisines, equipment).
create function public.text_array_ok(arr text[], max_items int, max_len int) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(cardinality(arr), 0) <= max_items
     and coalesce((select bool_and(char_length(x) between 1 and max_len) from unnest(arr) x), true)
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  country char(2) check (country ~ '^[A-Z]{2}$'),
  preferred_language text not null default 'en' check (preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  measurement_unit public.measurement_unit not null default 'metric',
  currency char(3) check (currency ~ '^[A-Z]{3}$'),
  birth_year smallint check (birth_year between 1900 and 2100),
  -- Health-related data (GDPR Art. 9). Only stored with explicit consent.
  sex_for_calc public.sex_for_calc,
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) check (weight_kg between 30 and 300),
  health_flags jsonb not null default '{}' check (jsonb_typeof(health_flags) = 'object'),
  health_data_consent_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_data_requires_consent check (
    health_data_consent_at is not null
    or (sex_for_calc is null and height_cm is null and weight_kg is null and health_flags = '{}')
  )
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create an empty profile for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.has_health_consent() returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and health_data_consent_at is not null
  )
$$;

-- ---------------------------------------------------------------------------
-- user_preferences (1:1 with user)
-- ---------------------------------------------------------------------------
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  goal public.goal not null default 'healthier',
  activity_level public.activity_level not null default 'light',
  dietary_pattern public.dietary_pattern not null default 'omnivore',
  allergies public.allergen[] not null default '{}',
  food_restrictions public.food_restriction[] not null default '{}',
  liked_foods text[] not null default '{}' check (public.text_array_ok(liked_foods, 30, 60)),
  disliked_foods text[] not null default '{}' check (public.text_array_ok(disliked_foods, 30, 60)),
  preferred_cuisines text[] not null default '{}' check (public.text_array_ok(preferred_cuisines, 12, 40)),
  budget_amount numeric(10, 2) check (budget_amount >= 0),
  budget_period text check (budget_period in ('day', 'week')),
  meals_per_day smallint not null default 3 check (meals_per_day between 2 and 6),
  include_snacks boolean not null default true,
  max_cook_minutes smallint check (max_cook_minutes between 5 and 240),
  cooking_skill text not null default 'easy' check (cooking_skill in ('easy', 'medium', 'advanced')),
  equipment text[] not null default '{}' check (public.text_array_ok(equipment, 20, 40)),
  other_preferences jsonb not null default '{}' check (jsonb_typeof(other_preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_has_period check ((budget_amount is null) = (budget_period is null))
);
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Food composition data (public, written only by trusted import scripts)
-- ---------------------------------------------------------------------------
create table public.food_items (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 200),
  aliases text[] not null default '{}',
  category text not null,
  fdc_id integer unique,
  -- Nutrients per 100 g edible portion.
  kcal numeric(7, 2) not null check (kcal between 0 and 900),
  protein_g numeric(6, 2) not null check (protein_g between 0 and 100),
  carbs_g numeric(6, 2) not null check (carbs_g between 0 and 100),
  fat_g numeric(6, 2) not null check (fat_g between 0 and 100),
  fibre_g numeric(6, 2) check (fibre_g between 0 and 100),
  sugar_g numeric(6, 2) check (sugar_g between 0 and 100),
  sat_fat_g numeric(6, 2) check (sat_fat_g between 0 and 100),
  sodium_mg numeric(8, 2) check (sodium_mg between 0 and 100000),
  extra_nutrients jsonb not null default '{}',
  allergens public.allergen[] not null default '{}',
  restrictions public.food_restriction[] not null default '{}',
  dietary_pattern public.dietary_pattern not null,
  source_name text not null,
  source_reference text not null,
  source_updated_at date not null,
  license text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index food_items_name_trgm on public.food_items using gin (name extensions.gin_trgm_ops);
create index food_items_aliases on public.food_items using gin (aliases);
create index food_items_category on public.food_items (category);
create trigger food_items_updated_at before update on public.food_items
  for each row execute function public.set_updated_at();

create table public.food_portions (
  id bigint generated always as identity primary key,
  food_item_id bigint not null references public.food_items (id) on delete cascade,
  description text not null,
  amount numeric(8, 3) not null check (amount > 0),
  unit text not null,
  gram_weight numeric(8, 2) not null check (gram_weight > 0),
  unique (food_item_id, amount, unit, description)
);
create index food_portions_food on public.food_portions (food_item_id);

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 150),
  description text check (char_length(description) <= 1000),
  instructions text[] not null default '{}' check (public.text_array_ok(instructions, 40, 1000)),
  prep_minutes smallint not null default 0 check (prep_minutes between 0 and 1440),
  cook_minutes smallint not null default 0 check (cook_minutes between 0 and 1440),
  servings smallint not null check (servings between 1 and 20),
  cuisine text check (char_length(cuisine) <= 40),
  meal_types public.meal_type[] not null default '{}',
  cost_tier smallint check (cost_tier between 1 and 3),
  origin public.recipe_origin not null,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'reviewed')),
  created_by uuid references auth.users (id) on delete cascade,
  visibility public.recipe_visibility not null default 'private',
  -- Derived from ingredients by trigger; client-supplied values are overwritten.
  dietary_pattern public.dietary_pattern not null default 'omnivore',
  allergen_tags public.allergen[] not null default '{}',
  restriction_tags public.food_restriction[] not null default '{}',
  nutrition_per_serving jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_recipes_are_curated check (visibility = 'private' or origin = 'curated'),
  constraint private_recipes_have_owner check (visibility = 'public' or created_by is not null)
);
create index recipes_created_by on public.recipes (created_by);
create index recipes_public on public.recipes (visibility, dietary_pattern) where visibility = 'public';

create table public.recipe_ingredients (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  food_item_id bigint not null references public.food_items (id) on delete restrict,
  quantity numeric(8, 2) not null check (quantity > 0),
  unit text not null check (char_length(unit) between 1 and 30),
  grams numeric(8, 2) not null check (grams > 0 and grams <= 5000),
  preparation_note text check (char_length(preparation_note) <= 200),
  position smallint not null default 0
);
create index recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_food on public.recipe_ingredients (food_item_id);

-- Recompute derived recipe fields from the ingredient list.
create function public.recipes_derive() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  n_ingredients integer;
  totals record;
begin
  select count(*),
         sum(ri.grams * f.kcal / 100) as kcal,
         sum(ri.grams * f.protein_g / 100) as protein,
         sum(ri.grams * f.carbs_g / 100) as carbs,
         sum(ri.grams * f.fat_g / 100) as fat,
         max(f.dietary_pattern) as pattern
    into totals
    from public.recipe_ingredients ri
    join public.food_items f on f.id = ri.food_item_id
   where ri.recipe_id = new.id;
  n_ingredients := totals.count;

  if n_ingredients = 0 then
    -- No ingredients yet: assume the least restrictive pattern and no
    -- nutrition, so the planner never picks it.
    new.dietary_pattern := 'omnivore';
    new.allergen_tags := '{}';
    new.restriction_tags := '{}';
    new.nutrition_per_serving := '{}';
  else
    new.dietary_pattern := totals.pattern;
    new.allergen_tags := coalesce((
      select array_agg(distinct a order by a)
        from public.recipe_ingredients ri
        join public.food_items f on f.id = ri.food_item_id
        cross join lateral unnest(f.allergens) a
       where ri.recipe_id = new.id), '{}');
    new.restriction_tags := coalesce((
      select array_agg(distinct r order by r)
        from public.recipe_ingredients ri
        join public.food_items f on f.id = ri.food_item_id
        cross join lateral unnest(f.restrictions) r
       where ri.recipe_id = new.id), '{}');
    new.nutrition_per_serving := jsonb_build_object(
      'kcal', round(totals.kcal / new.servings),
      'protein_g', round(totals.protein / new.servings, 1),
      'carbs_g', round(totals.carbs / new.servings, 1),
      'fat_g', round(totals.fat / new.servings, 1));
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger recipes_derive before insert or update on public.recipes
  for each row execute function public.recipes_derive();

-- Touch the parent recipe so its derived fields are recomputed.
create function public.recipe_ingredients_touch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.recipes set updated_at = now() where id = old.recipe_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.recipes set updated_at = now() where id = new.recipe_id;
  end if;
  return null;
end $$;
create trigger recipe_ingredients_touch after insert or update or delete on public.recipe_ingredients
  for each row execute function public.recipe_ingredients_touch();

-- ---------------------------------------------------------------------------
-- Meal plans
-- ---------------------------------------------------------------------------
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  goal public.goal not null,
  target_kcal integer check (target_kcal between 1000 and 6000),
  start_date date not null,
  end_date date not null,
  status public.plan_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_dates check (end_date >= start_date and end_date - start_date <= 27)
);
create index meal_plans_user on public.meal_plans (user_id, start_date desc);
create trigger meal_plans_updated_at before update on public.meal_plans
  for each row execute function public.set_updated_at();

create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  date date not null,
  meal_type public.meal_type not null,
  recipe_id uuid references public.recipes (id) on delete set null,
  recipe_title text not null,
  servings numeric(4, 2) not null check (servings > 0 and servings <= 10),
  -- Frozen at save time so the plan doesn't change if data is corrected later.
  nutrition_snapshot jsonb not null check (jsonb_typeof(nutrition_snapshot) = 'object'),
  position smallint not null default 0
);
create index planned_meals_plan on public.planned_meals (meal_plan_id, date);
create index planned_meals_recipe on public.planned_meals (recipe_id);

-- ---------------------------------------------------------------------------
-- Grocery lists
-- ---------------------------------------------------------------------------
create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_plan_id uuid references public.meal_plans (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index grocery_lists_user on public.grocery_lists (user_id, created_at desc);
create index grocery_lists_plan on public.grocery_lists (meal_plan_id);
create trigger grocery_lists_updated_at before update on public.grocery_lists
  for each row execute function public.set_updated_at();

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  quantity numeric(10, 2) check (quantity >= 0),
  unit text check (char_length(unit) <= 30),
  category text not null default 'other' check (char_length(category) <= 40),
  checked boolean not null default false,
  source text not null default 'manual' check (source in ('plan', 'manual')),
  position integer not null default 0
);
create index grocery_items_list on public.grocery_items (grocery_list_id);

-- ---------------------------------------------------------------------------
-- Progress tracking (health data: requires consent)
-- ---------------------------------------------------------------------------
create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(5, 1) check (weight_kg between 20 and 400),
  waist_cm numeric(5, 1) check (waist_cm between 30 and 300),
  measurements jsonb not null default '{}' check (jsonb_typeof(measurements) = 'object'),
  adherence_pct smallint check (adherence_pct between 0 and 100),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);
create trigger progress_entries_updated_at before update on public.progress_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Billing (written only by the verified webhook handler via service role)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  provider public.billing_provider not null,
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  status public.subscription_status not null,
  plan public.billing_plan not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Provider event IDs, for idempotent webhook processing.
create table public.billing_events (
  id text primary key,
  provider public.billing_provider not null,
  type text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

-- ---------------------------------------------------------------------------
-- AI usage, quotas and rate limits
-- ---------------------------------------------------------------------------
create table public.plan_limits (
  tier text not null check (tier in ('free', 'premium')),
  feature public.ai_feature not null,
  monthly_limit integer not null check (monthly_limit >= 0),
  primary key (tier, feature)
);
insert into public.plan_limits (tier, feature, monthly_limit) values
  ('free', 'meal_plan', 1), ('free', 'recipe', 3), ('free', 'substitution', 5),
  ('premium', 'meal_plan', 30), ('premium', 'recipe', 200), ('premium', 'substitution', 300);

create table public.ai_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  feature public.ai_feature not null,
  status public.ai_event_status not null default 'pending',
  model text,
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  cost_usd_est numeric(10, 6) check (cost_usd_est >= 0),
  latency_ms integer check (latency_ms >= 0),
  created_at timestamptz not null default now()
);
create index ai_events_user_feature on public.ai_events (user_id, feature, created_at desc);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create function public.is_premium(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (s.status in ('active', 'trialing', 'past_due')
           or (s.status = 'canceled' and s.current_period_end > now()))
  )
$$;

-- Usage for the current calendar month (UTC). Errors don't count against quota.
create function public.quota_status(p_feature public.ai_feature)
returns table (tier text, used integer, monthly_limit integer, resets_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with t as (
    select case when public.is_premium((select auth.uid())) then 'premium' else 'free' end as tier
  )
  select
    t.tier,
    (select count(*)::int from public.ai_events e
      where e.user_id = (select auth.uid()) and e.feature = p_feature
        and e.status <> 'error'
        and e.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'),
    l.monthly_limit,
    (date_trunc('month', now() at time zone 'utc') + interval '1 month') at time zone 'utc'
  from t join public.plan_limits l on l.tier = t.tier and l.feature = p_feature
  where (select auth.uid()) is not null
$$;

-- Atomically reserve one unit of quota. Returns the ai_events id, or null if
-- the quota is exhausted. The server later updates the event's status/tokens.
create function public.consume_quota(p_feature public.ai_feature) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  q record;
  event_id bigint;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  -- Serialize concurrent requests from the same user for this feature.
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_feature::text, 0));
  select * into q from public.quota_status(p_feature);
  if q.used >= q.monthly_limit then
    return null;
  end if;
  insert into public.ai_events (user_id, feature) values (uid, p_feature) returning id into event_id;
  return event_id;
end $$;

-- Fixed-window rate limiter. Returns true if the request is allowed.
create function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  win timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, win, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into n;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return n <= p_limit;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.food_items enable row level security;
alter table public.food_portions enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.progress_entries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.plan_limits enable row level security;
alter table public.ai_events enable row level security;
alter table public.rate_limits enable row level security;

-- profiles: own row only. Rows are created by trigger and removed with the auth user.
create policy "profiles: read own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Owner-only CRUD tables.
create policy "user_preferences: own" on public.user_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "meal_plans: own" on public.meal_plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "grocery_lists: own" on public.grocery_lists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "progress_entries: read own" on public.progress_entries for select to authenticated
  using (user_id = (select auth.uid()));
create policy "progress_entries: delete own" on public.progress_entries for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "progress_entries: insert own with consent" on public.progress_entries for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_health_consent());
create policy "progress_entries: update own with consent" on public.progress_entries for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_health_consent());

-- Child tables: access follows the parent.
create policy "planned_meals: via own plan" on public.planned_meals for all to authenticated
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = (select auth.uid())));
create policy "grocery_items: via own list" on public.grocery_items for all to authenticated
  using (exists (select 1 from public.grocery_lists l where l.id = grocery_list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.grocery_lists l where l.id = grocery_list_id and l.user_id = (select auth.uid())));

-- Food data: public read; writes only via service role (bypasses RLS).
create policy "food_items: public read" on public.food_items for select to anon, authenticated using (true);
create policy "food_portions: public read" on public.food_portions for select to anon, authenticated using (true);
create policy "plan_limits: public read" on public.plan_limits for select to anon, authenticated using (true);

-- Recipes: public curated recipes for everyone; users manage their own private ones.
create policy "recipes: read public" on public.recipes for select to anon, authenticated
  using (visibility = 'public');
create policy "recipes: read own" on public.recipes for select to authenticated
  using (created_by = (select auth.uid()));
create policy "recipes: insert own" on public.recipes for insert to authenticated
  with check (created_by = (select auth.uid()) and visibility = 'private' and origin = 'user');
create policy "recipes: update own" on public.recipes for update to authenticated
  using (created_by = (select auth.uid()) and origin = 'user')
  with check (created_by = (select auth.uid()) and visibility = 'private' and origin = 'user');
create policy "recipes: delete own" on public.recipes for delete to authenticated
  using (created_by = (select auth.uid()) and origin = 'user');

create policy "recipe_ingredients: read via recipe" on public.recipe_ingredients for select to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id
    and (r.visibility = 'public' or r.created_by = (select auth.uid()))));
create policy "recipe_ingredients: write own user recipe" on public.recipe_ingredients for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id
    and r.created_by = (select auth.uid()) and r.origin = 'user'))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id
    and r.created_by = (select auth.uid()) and r.origin = 'user'));

-- Billing and AI usage: users can read their own; only the server writes.
create policy "subscriptions: read own" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "ai_events: read own" on public.ai_events for select to authenticated
  using (user_id = (select auth.uid()));
-- billing_events and rate_limits: no policies (service role only).

-- Function privileges.
revoke execute on function public.consume_quota(public.ai_feature) from public, anon;
grant execute on function public.consume_quota(public.ai_feature) to authenticated;
revoke execute on function public.quota_status(public.ai_feature) from public, anon;
grant execute on function public.quota_status(public.ai_feature) to authenticated;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
revoke execute on function public.is_premium(uuid) from public, anon, authenticated;
grant execute on function public.is_premium(uuid) to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Defense in depth: clients can never write reference, billing or usage data,
-- even if a policy is added by mistake later.
revoke insert, update, delete, truncate on
  public.food_items, public.food_portions, public.plan_limits,
  public.subscriptions, public.billing_events, public.ai_events, public.rate_limits
  from anon, authenticated;
revoke select on public.billing_events, public.rate_limits from anon, authenticated;
