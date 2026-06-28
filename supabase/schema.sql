create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  display_name text,
  lock_pin_hash text,
  lock_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text,
  body text,
  mood integer check (mood is null or mood between 1 and 5),
  stress_level integer check (stress_level is null or stress_level between 1 and 5),
  anxiety_level integer check (anxiety_level is null or anxiety_level between 1 and 5),
  fulfillment_level integer check (fulfillment_level is null or fulfillment_level between 1 and 5),
  physical_condition integer check (physical_condition is null or physical_condition between 1 and 5),
  wake_time time,
  sleep_hours numeric,
  weather text,
  breakfast text,
  lunch text,
  dinner text,
  snack text,
  meal_note text,
  good_things text,
  reflections text,
  learnings text,
  worries text,
  tomorrow_todo text,
  tomorrow_policy text,
  memo text,
  idea_note text,
  news_note text,
  body_weight numeric,
  word_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diary_entries_user_date_unique unique(user_id, date)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_user_name_unique unique(user_id, name)
);

create table if not exists public.diary_entry_tags (
  diary_entry_id uuid not null references public.diary_entries(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (diary_entry_id, tag_id)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  query text,
  filters jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  lock_timeout_minutes integer not null default 10,
  default_view text not null default 'today',
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists diary_entries_updated_at on public.diary_entries;
create trigger diary_entries_updated_at before update on public.diary_entries
for each row execute function public.set_updated_at();

drop trigger if exists tags_updated_at on public.tags;
create trigger tags_updated_at before update on public.tags
for each row execute function public.set_updated_at();

drop trigger if exists saved_searches_updated_at on public.saved_searches;
create trigger saved_searches_updated_at before update on public.saved_searches
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.diary_entries enable row level security;
alter table public.tags enable row level security;
alter table public.diary_entry_tags enable row level security;
alter table public.saved_searches enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profiles are owned by user" on public.profiles;
create policy "profiles are owned by user" on public.profiles
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "entries are owned by user" on public.diary_entries;
create policy "entries are owned by user" on public.diary_entries
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tags are owned by user" on public.tags;
create policy "tags are owned by user" on public.tags
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "entry tags follow entry owner" on public.diary_entry_tags;
create policy "entry tags follow entry owner" on public.diary_entry_tags
for all using (
  exists (
    select 1 from public.diary_entries e
    where e.id = diary_entry_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.diary_entries e
    join public.tags t on t.id = tag_id
    where e.id = diary_entry_id
      and e.user_id = auth.uid()
      and t.user_id = auth.uid()
  )
);

drop policy if exists "saved searches are owned by user" on public.saved_searches;
create policy "saved searches are owned by user" on public.saved_searches
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "settings are owned by user" on public.app_settings;
create policy "settings are owned by user" on public.app_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists diary_entries_user_date_idx on public.diary_entries(user_id, date desc);
create index if not exists diary_entries_search_idx on public.diary_entries using gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(meal_note, ''))
);
create index if not exists tags_user_name_idx on public.tags(user_id, name);
