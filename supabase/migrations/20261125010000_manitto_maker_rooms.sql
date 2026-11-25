-- Link-shared Manitto Maker rooms are separate from the app-wide weekly
-- anonymous prayer matching. The browser never receives the complete draw.
create table if not exists public.manitto_maker_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{12}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 60),
  note text not null default '' check (char_length(note) <= 200),
  capacity integer not null check (capacity between 3 and 50),
  status text not null default 'open' check (status in ('open', 'drawn')),
  drawn_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists manitto_maker_rooms_host_created_idx
  on public.manitto_maker_rooms (host_user_id, created_at desc);
create index if not exists manitto_maker_rooms_expiry_idx
  on public.manitto_maker_rooms (expires_at);

create table if not exists public.manitto_maker_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.manitto_maker_rooms(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 24),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  recipient_id uuid references public.manitto_maker_participants(id) on delete set null,
  joined_at timestamptz not null default now()
);

create unique index if not exists manitto_maker_participants_room_name_idx
  on public.manitto_maker_participants (room_id, lower(name));
create unique index if not exists manitto_maker_participants_recipient_idx
  on public.manitto_maker_participants (room_id, recipient_id)
  where recipient_id is not null;
create index if not exists manitto_maker_participants_room_joined_idx
  on public.manitto_maker_participants (room_id, joined_at);

alter table public.manitto_maker_rooms enable row level security;
alter table public.manitto_maker_participants enable row level security;
revoke all on public.manitto_maker_rooms from anon, authenticated;
revoke all on public.manitto_maker_participants from anon, authenticated;
grant select, insert, update, delete on public.manitto_maker_rooms to service_role;
grant select, insert, update, delete on public.manitto_maker_participants to service_role;

-- Lock the room before checking its capacity or status so simultaneous joins
-- cannot overfill it or arrive after the draw begins.
create or replace function public.join_manitto_maker_room(
  p_code text,
  p_name text,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.manitto_maker_rooms%rowtype;
  v_count integer;
  v_participant_id uuid;
begin
  if p_name is null or char_length(trim(p_name)) not between 1 and 24
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid participant details';
  end if;

  select * into v_room
  from public.manitto_maker_rooms
  where code = p_code
  for update;
  if not found or v_room.expires_at <= now() then
    raise exception 'room not found or expired';
  end if;
  if v_room.status <> 'open' then
    raise exception 'draw has already started';
  end if;

  select id into v_participant_id
  from public.manitto_maker_participants
  where room_id = v_room.id and token_hash = p_token_hash;
  if v_participant_id is not null then return v_participant_id; end if;

  select count(*) into v_count
  from public.manitto_maker_participants where room_id = v_room.id;
  if v_count >= v_room.capacity then raise exception 'room is full'; end if;

  insert into public.manitto_maker_participants (room_id, name, token_hash)
  values (v_room.id, trim(p_name), p_token_hash)
  returning id into v_participant_id;
  return v_participant_id;
end;
$$;

-- A single shuffled cycle guarantees everyone gives to exactly one person,
-- no one draws themselves, and groups of 3+ have no reciprocal pair.
create or replace function public.draw_manitto_maker_room(
  p_room_id uuid,
  p_host_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.manitto_maker_rooms%rowtype;
  v_ids uuid[];
  v_count integer;
  v_index integer;
begin
  select * into v_room
  from public.manitto_maker_rooms
  where id = p_room_id
  for update;
  if not found or v_room.expires_at <= now() then
    raise exception 'room not found or expired';
  end if;
  if v_room.host_user_id <> p_host_user_id then
    raise exception 'room host required';
  end if;
  if v_room.status <> 'open' then
    raise exception 'room already drawn';
  end if;

  select array_agg(id order by gen_random_uuid()) into v_ids
  from public.manitto_maker_participants
  where room_id = v_room.id;
  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count < 3 then raise exception 'at least three participants required'; end if;
  if v_count > v_room.capacity then raise exception 'room capacity exceeded'; end if;

  for v_index in 1..v_count loop
    update public.manitto_maker_participants
    set recipient_id = v_ids[(v_index % v_count) + 1]
    where id = v_ids[v_index] and room_id = v_room.id;
  end loop;

  update public.manitto_maker_rooms
  set status = 'drawn', drawn_at = now()
  where id = v_room.id;
  return v_count;
end;
$$;

create or replace function public.remove_manitto_maker_participant(
  p_room_id uuid,
  p_host_user_id uuid,
  p_participant_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.manitto_maker_rooms%rowtype;
begin
  select * into v_room
  from public.manitto_maker_rooms
  where id = p_room_id
  for update;
  if not found or v_room.expires_at <= now() then
    raise exception 'room not found or expired';
  end if;
  if v_room.host_user_id <> p_host_user_id or v_room.status <> 'open' then
    raise exception 'room host and open status required';
  end if;
  delete from public.manitto_maker_participants
  where room_id = v_room.id and id = p_participant_id;
end;
$$;

revoke all on function public.join_manitto_maker_room(text, text, text) from public, anon, authenticated;
revoke all on function public.draw_manitto_maker_room(uuid, uuid) from public, anon, authenticated;
revoke all on function public.remove_manitto_maker_participant(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.join_manitto_maker_room(text, text, text) to service_role;
grant execute on function public.draw_manitto_maker_room(uuid, uuid) to service_role;
grant execute on function public.remove_manitto_maker_participant(uuid, uuid, uuid) to service_role;
