-- Noosh database schema.
-- Paste this whole file into Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Safe to run once on a fresh project.

-- 1. Preferences: one row per user, set once and edited occasionally.
create table public.preferences (
  user_id     uuid primary key references auth.users on delete cascade default auth.uid(),
  diet        text not null default 'No restrictions',
  goals       text not null default '',
  avoid       text not null default '',
  dinners     int  not null default 4  check (dinners between 3 and 5),
  meals       text[] not null default '{breakfast,lunch,dinner}',  -- which meals to plan
  servings    int  not null default 2  check (servings between 1 and 8),
  max_minutes int  not null default 45 check (max_minutes between 10 and 120),
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

-- 2. Kitchen: what's left over at the end of the week, plus anything else in the fridge.
create table public.kitchen (
  user_id    uuid primary key references auth.users on delete cascade default auth.uid(),
  leftovers  text[] not null default '{}',  -- picked from last week's ingredients
  extras     text[] not null default '{}',  -- typed in by the user
  updated_at timestamptz not null default now()
);

-- 3. Plans: every plan ever generated. The newest row is "this week".
--    Keeping old rows gives us recipe history for free (and avoids repeats).
create table public.plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade default auth.uid(),
  week           int  not null default 1,
  plan           jsonb not null,             -- the AI's structured output
  checked        jsonb not null default '{}', -- grocery checkboxes: {"Produce|Spinach": true}
  used_leftovers text[] not null default '{}',
  created_at     timestamptz not null default now()
);
create index plans_user_created on public.plans (user_id, created_at desc);

-- Row Level Security: the database itself enforces "you can only touch your own rows",
-- so even a bug in the app can't leak one user's data to another.
alter table public.preferences enable row level security;
alter table public.kitchen     enable row level security;
alter table public.plans       enable row level security;

create policy "own preferences" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own kitchen" on public.kitchen
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plans" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
