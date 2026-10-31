-- Phase 2: meal planner, grocery lists, saved recipes.

-- Stable key that curated recipe files use to reference foods.
alter table public.food_items add column slug text unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$');
alter table public.food_items add column display_name text check (char_length(display_name) <= 120);

-- How a plan was produced, for auditing and quality monitoring.
alter table public.meal_plans add column generator text not null default 'rules'
  check (generator in ('ai', 'rules'));
alter table public.meal_plans add column ai_event_id bigint references public.ai_events (id) on delete set null;
alter table public.meal_plans add column targets_snapshot jsonb not null default '{}'
  check (jsonb_typeof(targets_snapshot) = 'object');
create index meal_plans_ai_event on public.meal_plans (ai_event_id);

-- Slot within the day (0-based) so a day can hold e.g. two snacks.
alter table public.planned_meals add column slot smallint not null default 0 check (slot between 0 and 9);
create unique index planned_meals_plan_date_slot on public.planned_meals (meal_plan_id, date, slot);

-- Grocery lists scale by household size; plan-derived items link to food data.
alter table public.grocery_lists add column household_size smallint not null default 1
  check (household_size between 1 and 12);
alter table public.grocery_items add column food_item_id bigint references public.food_items (id) on delete set null;
create index grocery_items_food on public.grocery_items (food_item_id);

-- Users' saved recipes.
create table public.saved_recipes (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index saved_recipes_recipe on public.saved_recipes (recipe_id);
alter table public.saved_recipes enable row level security;
create policy "saved_recipes: own" on public.saved_recipes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.recipes r where r.id = recipe_id
      and (r.visibility = 'public' or r.created_by = (select auth.uid())))
  );

-- Only one active plan per user.
create unique index meal_plans_one_active on public.meal_plans (user_id) where status = 'active';

