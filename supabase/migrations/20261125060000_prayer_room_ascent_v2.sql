begin;

alter table public.prayer_room_presence
  add column world_version smallint not null default 1,
  add column visit_id uuid,
  add column is_praying boolean not null default false;

alter table public.prayer_room_presence
  drop constraint prayer_room_presence_y_check,
  add constraint prayer_room_presence_ascent_check check (
    (world_version = 1 and visit_id is null and not is_praying and y between 0 and 1120)
    or (world_version = 2 and visit_id is not null and y between 0 and 2240)
  );

create function public.exchange_prayer_room_state_v2(
  p_user_id uuid, p_x smallint, p_y smallint, p_facing text, p_avatar_id text, p_chat text,
  p_visit_id uuid, p_is_praying boolean
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  stamp timestamptz := now();
  version smallint := case when p_visit_id is null then 1 else 2 end;
  own_join timestamptz;
  sent boolean := false;
  peers jsonb;
  messages jsonb;
begin
  if not exists (
    select 1 from public.user_profiles p
    join public.allowed_users a on lower(a.email) = lower(p.email)
    where p.user_id = p_user_id and p.completed_at is not null
      and p.reference_age between 20 and 59 and a.status = 'active' and a.agreed_at is not null
  ) then
    raise exception 'Prayer room access denied' using errcode = '42501';
  end if;

  insert into public.prayer_room_presence as existing
    (user_id, x, y, facing, avatar_id, last_seen, world_version, visit_id, is_praying)
  values
    (p_user_id, p_x, p_y, p_facing, p_avatar_id, stamp, version, p_visit_id,
      version = 2 and coalesce(p_is_praying, false))
  on conflict (user_id) do update set
    x = excluded.x, y = excluded.y, facing = excluded.facing, avatar_id = excluded.avatar_id,
    presence_id = case when existing.last_seen < stamp - interval '15 seconds'
      or existing.world_version <> excluded.world_version
      or existing.visit_id is distinct from excluded.visit_id
      then gen_random_uuid() else existing.presence_id end,
    last_seen = excluded.last_seen,
    world_version = excluded.world_version,
    visit_id = excluded.visit_id,
    is_praying = excluded.is_praying
  where existing.last_seen <= excluded.last_seen
  returning last_seen into own_join;

  if own_join is not null and p_chat is not null and not exists (
    select 1 from public.prayer_room_messages m
    where m.user_id = p_user_id and m.created_at > stamp - interval '4 seconds'
  ) then
    insert into public.prayer_room_messages (user_id, body, created_at) values (p_user_id, p_chat, stamp);
    sent := true;
  end if;

  -- Keep old installed clients on their original map. Both versions
  -- can still read/send recent room chat regardless of map height.
  select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) into peers from (
    select r.presence_id as id, p.nickname, r.x, r.y, r.facing, r.avatar_id as "avatarId",
      r.is_praying as "isPraying"
    from public.prayer_room_presence r
    join public.user_profiles p on p.user_id = r.user_id
    join public.allowed_users a on lower(a.email) = lower(p.email) and a.status = 'active' and a.agreed_at is not null
    where r.user_id <> p_user_id and r.world_version = version and r.last_seen > stamp - interval '15 seconds'
      and p.completed_at is not null and p.reference_age between 20 and 59
      and not exists (select 1 from public.user_blocks b where
        (b.blocker_user_id = p_user_id and b.blocked_user_id = r.user_id)
        or (b.blocker_user_id = r.user_id and b.blocked_user_id = p_user_id))
    order by r.last_seen desc
    limit 30
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q."sentAt", q.id), '[]'::jsonb) into messages from (
    select m.id, p.nickname, m.body as text, m.created_at as "sentAt"
    from public.prayer_room_messages m
    join public.user_profiles p on p.user_id = m.user_id
    join public.allowed_users a on lower(a.email) = lower(p.email) and a.status = 'active' and a.agreed_at is not null
    where m.created_at > stamp - interval '15 minutes'
      and p.completed_at is not null and p.reference_age between 20 and 59
      and not exists (select 1 from public.user_blocks b where
        (b.blocker_user_id = p_user_id and b.blocked_user_id = m.user_id)
        or (b.blocker_user_id = m.user_id and b.blocked_user_id = p_user_id))
    order by m.created_at desc, m.id desc
    limit 24
  ) q;

  return jsonb_build_object('peers', peers, 'messages', messages, 'chatSent', sent);
end;
$$;

create or replace function public.exchange_prayer_room_state(
  p_user_id uuid, p_x smallint, p_y smallint, p_facing text, p_avatar_id text, p_chat text
)
returns jsonb
language sql
set search_path = ''
as $$
  select public.exchange_prayer_room_state_v2(p_user_id, p_x, p_y, p_facing, p_avatar_id, p_chat, null, false);
$$;

revoke all on function public.exchange_prayer_room_state_v2(uuid, smallint, smallint, text, text, text, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.exchange_prayer_room_state_v2(uuid, smallint, smallint, text, text, text, uuid, boolean)
  to service_role;

commit;
