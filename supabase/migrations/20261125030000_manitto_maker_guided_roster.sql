-- Guided maker: room organizers can prepare a roster without receiving any
-- participant's private result credential. An invitation can be used once.
alter table public.manitto_maker_rooms
  add column if not exists host_name text not null default ''
    check (char_length(host_name) <= 24);

alter table public.manitto_maker_rooms
  drop constraint if exists manitto_maker_rooms_capacity_check;
alter table public.manitto_maker_rooms
  add constraint manitto_maker_rooms_capacity_check check (capacity between 2 and 50);

alter table public.manitto_maker_participants
  add column if not exists invite_pending boolean not null default false;

create or replace function public.manage_manitto_maker_roster(
  p_room_id uuid,
  p_host_user_id uuid,
  p_action text,
  p_name text default null,
  p_participant_id uuid default null,
  p_token_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.manitto_maker_rooms%rowtype;
  v_participant_id uuid;
begin
  select * into v_room from public.manitto_maker_rooms
  where id = p_room_id for update;
  if not found or v_room.expires_at <= now()
     or p_host_user_id is null or v_room.host_user_id <> p_host_user_id then
    raise exception 'room host required';
  end if;
  if p_action is null or p_action not in ('add', 'rename', 'invite') then
    raise exception 'invalid action';
  end if;
  if p_action <> 'invite' and v_room.status <> 'open' then
    raise exception 'roster is closed';
  end if;
  if p_action in ('add', 'rename') and
     (p_name is null or char_length(trim(p_name)) not between 1 and 24) then
    raise exception 'invalid participant';
  end if;
  if p_action in ('add', 'invite') and
     (p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$') then
    raise exception 'invalid credential';
  end if;

  if p_action = 'add' then
    if (select count(*) from public.manitto_maker_participants where room_id = p_room_id) >= v_room.capacity then
      raise exception 'room is full';
    end if;
    insert into public.manitto_maker_participants (room_id, name, token_hash, invite_pending)
    values (p_room_id, trim(p_name), p_token_hash, true)
    returning id into v_participant_id;
  elsif p_action = 'rename' then
    update public.manitto_maker_participants set name = trim(p_name)
    where id = p_participant_id and room_id = p_room_id returning id into v_participant_id;
  else
    -- Never issue a replacement invite once a guest holds the private token.
    update public.manitto_maker_participants set token_hash = p_token_hash
    where id = p_participant_id and room_id = p_room_id and invite_pending
    returning id into v_participant_id;
  end if;
  if v_participant_id is null then raise exception 'participant unavailable'; end if;
  return v_participant_id;
end;
$$;

create or replace function public.claim_manitto_maker_invite(
  p_room_id uuid,
  p_invite_hash text,
  p_guest_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room public.manitto_maker_rooms%rowtype;
  v_participant_id uuid;
begin
  if p_invite_hash is null or p_invite_hash !~ '^[0-9a-f]{64}$'
     or p_guest_hash is null or p_guest_hash !~ '^[0-9a-f]{64}$'
     or p_guest_hash = p_invite_hash then
    raise exception 'invalid credential';
  end if;
  select * into v_room from public.manitto_maker_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now() then raise exception 'room unavailable'; end if;

  -- A retry with the same private credential must not consume a second seat.
  select id into v_participant_id from public.manitto_maker_participants
  where room_id = p_room_id and not invite_pending and token_hash = p_guest_hash;
  if v_participant_id is not null then return v_participant_id; end if;

  update public.manitto_maker_participants
  set token_hash = p_guest_hash, invite_pending = false
  where room_id = p_room_id and invite_pending and token_hash = p_invite_hash
  returning id into v_participant_id;
  if v_participant_id is null then raise exception 'invitation unavailable'; end if;
  return v_participant_id;
end;
$$;

-- A single random cycle never assigns a participant to themself. Two
-- participants necessarily draw each other; larger groups are nonreciprocal.
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
  select * into v_room from public.manitto_maker_rooms where id = p_room_id for update;
  if not found or v_room.expires_at <= now()
     or p_host_user_id is null or v_room.host_user_id <> p_host_user_id then
    raise exception 'room host required';
  end if;
  if v_room.status <> 'open' then raise exception 'room already drawn'; end if;

  select array_agg(id order by gen_random_uuid()) into v_ids
  from public.manitto_maker_participants where room_id = v_room.id;
  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count < 2 or v_count > v_room.capacity then raise exception 'invalid participant count'; end if;

  for v_index in 1..v_count loop
    update public.manitto_maker_participants
    set recipient_id = v_ids[(v_index % v_count) + 1]
    where id = v_ids[v_index] and room_id = v_room.id;
  end loop;
  update public.manitto_maker_rooms set status = 'drawn', drawn_at = now() where id = v_room.id;
  return v_count;
end;
$$;

revoke all on function public.manage_manitto_maker_roster(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.claim_manitto_maker_invite(uuid, text, text) from public, anon, authenticated;
revoke all on function public.draw_manitto_maker_room(uuid, uuid) from public, anon, authenticated;
grant execute on function public.manage_manitto_maker_roster(uuid, uuid, text, text, uuid, text) to service_role;
grant execute on function public.claim_manitto_maker_invite(uuid, text, text) to service_role;
grant execute on function public.draw_manitto_maker_room(uuid, uuid) to service_role;
