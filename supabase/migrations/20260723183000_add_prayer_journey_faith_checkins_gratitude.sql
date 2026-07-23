-- Prayer journey, daily faith check-in, and gratitude journal.

alter table public.posts
add column if not exists prayer_stage text;

update public.posts
set prayer_stage = 'requested'
where board = 'prayer'
  and prayer_stage is null;

alter table public.posts
drop constraint if exists posts_prayer_stage_check;

alter table public.posts
add constraint posts_prayer_stage_check
check (
  (board = 'prayer' and prayer_stage in ('requested', 'praying', 'answered', 'grateful'))
  or (board <> 'prayer' and prayer_stage is null)
);

create index if not exists posts_prayer_stage_idx
on public.posts (prayer_stage, created_at desc)
where board = 'prayer' and status = 'visible';

create table if not exists public.faith_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  mood text not null check (mood in ('peaceful', 'grateful', 'tired', 'anxious', 'lonely')),
  faith_weather text not null check (faith_weather in ('sunny', 'partly_cloudy', 'cloudy', 'rainy')),
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists faith_checkins_user_date_idx
on public.faith_checkins (user_id, checkin_date desc);

create table if not exists public.gratitude_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  challenge_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  content text not null check (char_length(content) between 1 and 280),
  challenge_enabled boolean not null default false,
  gratitude_voice text check (gratitude_voice is null or char_length(gratitude_voice) <= 280),
  recipient_user_id uuid references auth.users(id) on delete set null,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists gratitude_entries_user_date_idx
on public.gratitude_entries (user_id, entry_date desc);

create index if not exists gratitude_entries_recipient_idx
on public.gratitude_entries (recipient_user_id, delivered_at desc)
where recipient_user_id is not null;

alter table public.faith_checkins enable row level security;
alter table public.gratitude_preferences enable row level security;
alter table public.gratitude_entries enable row level security;

drop policy if exists "Users can read own faith checkins" on public.faith_checkins;
create policy "Users can read own faith checkins"
on public.faith_checkins for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own faith checkins" on public.faith_checkins;
create policy "Users can create own faith checkins"
on public.faith_checkins for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own gratitude preference" on public.gratitude_preferences;
create policy "Users can read own gratitude preference"
on public.gratitude_preferences for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can manage own gratitude preference" on public.gratitude_preferences;
create policy "Users can manage own gratitude preference"
on public.gratitude_preferences for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own gratitude and deliveries" on public.gratitude_entries;
create policy "Users can read own gratitude and deliveries"
on public.gratitude_entries for select to authenticated
using (auth.uid() = user_id or auth.uid() = recipient_user_id);

drop policy if exists "Users can create own gratitude" on public.gratitude_entries;
create policy "Users can create own gratitude"
on public.gratitude_entries for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own gratitude" on public.gratitude_entries;
create policy "Users can update own gratitude"
on public.gratitude_entries for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert on public.faith_checkins to authenticated;
grant select, insert, update on public.gratitude_preferences to authenticated;
grant select, insert, update on public.gratitude_entries to authenticated;
