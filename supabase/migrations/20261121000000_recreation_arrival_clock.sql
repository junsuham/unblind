-- Shared recreation rooms are accessed only through server routes. A room
-- code grants read/join access; only the authenticated creator may check in.
create table if not exists public.recreation_arrival_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  organizer_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  appointment_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint recreation_arrival_rooms_code_format check (room_code ~ '^[a-f0-9]{32}$')
);

create index if not exists recreation_arrival_rooms_organizer_created_idx
  on public.recreation_arrival_rooms (organizer_user_id, created_at desc);

create table if not exists public.recreation_arrival_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.recreation_arrival_rooms(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  joined_at timestamptz not null default now(),
  arrived_at timestamptz,
  constraint recreation_arrival_participants_arrival_order check (arrived_at is null or arrived_at >= joined_at)
);

create index if not exists recreation_arrival_participants_room_joined_idx
  on public.recreation_arrival_participants (room_id, joined_at);

alter table public.recreation_arrival_rooms enable row level security;
alter table public.recreation_arrival_participants enable row level security;

revoke all on public.recreation_arrival_rooms from anon, authenticated;
revoke all on public.recreation_arrival_participants from anon, authenticated;
