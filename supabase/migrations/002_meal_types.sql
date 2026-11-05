-- Lets each person choose which meals NOOSH plans (breakfast, lunch, dinner, snacks).
-- Existing accounts keep planning dinners only until they change it in Preferences.
alter table public.preferences
  add column if not exists meals text[] not null default '{dinner}';
alter table public.preferences
  alter column meals set default '{breakfast,lunch,dinner}';
