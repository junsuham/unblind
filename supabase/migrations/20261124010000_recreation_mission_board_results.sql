-- A room's existing unguessable UUID is the shared read-only board link.
-- Results are append-on-completion; the unique round key makes double clicks safe.
create table if not exists public.recreation_mission_board_results (
  room_id uuid not null references public.recreation_mission_rooms(id) on delete cascade,
  round_no integer not null check (round_no between 1 and 200),
  team_number integer not null check (team_number between 1 and 8),
  card_id text not null check (char_length(card_id) between 1 and 120),
  points integer not null check (points between 0 and 100),
  completed_at timestamptz not null default now(),
  completed_by uuid not null references auth.users(id) on delete cascade,
  primary key (room_id, round_no)
);

create index if not exists recreation_mission_board_results_team_idx
  on public.recreation_mission_board_results(room_id, team_number, round_no desc);

alter table public.recreation_mission_board_results enable row level security;
revoke all on public.recreation_mission_board_results from anon, authenticated;

-- The existing 7-day recreation_mission_rooms cleanup cascades to these rows.
