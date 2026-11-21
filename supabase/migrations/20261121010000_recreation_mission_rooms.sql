-- Shareable recreation rooms are accessible only through server routes.
create table if not exists public.recreation_mission_rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('team', 'individual')),
  team_count integer not null default 0 check (team_count between 0 and 8),
  category text not null check (category in ('church', 'daily', 'food', 'dessert')),
  current_card_id text,
  assignments jsonb not null default '{}'::jsonb,
  used_card_ids text[] not null default '{}'::text[],
  round_no integer not null default 0 check (round_no >= 0),
  drawn_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint mission_team_count_matches_mode check (
    (mode = 'team' and team_count between 2 and 8)
    or (mode = 'individual' and team_count = 0)
  )
);

create table if not exists public.recreation_mission_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.recreation_mission_rooms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  team_number integer check (team_number between 1 and 8),
  joined_at timestamptz not null default now()
);

create index if not exists recreation_mission_participants_room_idx
on public.recreation_mission_participants(room_id, joined_at);
create index if not exists recreation_mission_rooms_host_idx
on public.recreation_mission_rooms(host_user_id, created_at desc);

alter table public.recreation_mission_rooms enable row level security;
alter table public.recreation_mission_participants enable row level security;
revoke all on public.recreation_mission_rooms from anon, authenticated;
revoke all on public.recreation_mission_participants from anon, authenticated;

-- No anon/authenticated policies. All access goes through validated server routes
-- using the service role; guessing a room UUID does not grant host privileges.
