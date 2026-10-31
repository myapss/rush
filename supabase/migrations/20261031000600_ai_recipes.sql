-- AI recipe generator: users can own private AI-generated recipes.

alter table public.recipes add column substitutions jsonb not null default '[]' check (jsonb_typeof(substitutions) = 'array');
alter table public.recipes add column ai_event_id bigint references public.ai_events (id) on delete set null;
create index recipes_ai_event on public.recipes (ai_event_id);

-- Users may create, edit and delete their own private recipes of origin
-- 'user' or 'ai_generated'. Curated/public recipes stay read-only.
drop policy "recipes: insert own" on public.recipes;
drop policy "recipes: update own" on public.recipes;
drop policy "recipes: delete own" on public.recipes;
drop policy "recipe_ingredients: write own user recipe" on public.recipe_ingredients;

create policy "recipes: insert own" on public.recipes for insert to authenticated
  with check (created_by = (select auth.uid()) and visibility = 'private' and origin in ('user', 'ai_generated'));
create policy "recipes: update own" on public.recipes for update to authenticated
  using (created_by = (select auth.uid()) and origin in ('user', 'ai_generated'))
  with check (created_by = (select auth.uid()) and visibility = 'private' and origin in ('user', 'ai_generated'));
create policy "recipes: delete own" on public.recipes for delete to authenticated
  using (created_by = (select auth.uid()) and origin in ('user', 'ai_generated'));
create policy "recipe_ingredients: write own recipe" on public.recipe_ingredients for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id
    and r.created_by = (select auth.uid()) and r.origin in ('user', 'ai_generated')))
  with check (exists (select 1 from public.recipes r where r.id = recipe_id
    and r.created_by = (select auth.uid()) and r.origin in ('user', 'ai_generated')));
