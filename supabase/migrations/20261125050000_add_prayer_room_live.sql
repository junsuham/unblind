begin;

create table public.prayer_room_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  presence_id uuid not null unique default gen_random_uuid(),
  x smallint not null check (x between 0 and 360),
  y smallint not null check (y between 0 and 1120),
  facing text not null check (facing in ('left', 'right')),
  avatar_id text not null check (avatar_id ~ '^[a-z]{1,24}$'),
  last_seen timestamptz not null default now()
);
create index prayer_room_presence_expiry on public.prayer_room_presence (last_seen);

create table public.prayer_room_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 160),
  created_at timestamptz not null default now()
);
create index prayer_room_messages_recent on public.prayer_room_messages (created_at desc);
create index prayer_room_messages_by_user on public.prayer_room_messages (user_id, created_at desc);

alter table public.prayer_room_presence enable row level security;
alter table public.prayer_room_messages enable row level security;
revoke all on public.prayer_room_presence, public.prayer_room_messages from anon, authenticated;

create function public.exchange_prayer_room_state(
  p_user_id uuid, p_x smallint, p_y smallint, p_facing text, p_avatar_id text, p_chat text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  stamp timestamptz := now();
  own_join timestamptz;
  sent boolean := false;
  peers jsonb;
  messages jsonb;
begin
  -- API already verifies membership; don't trust a stale revoked approval here.
  if not exists (
    select 1 from public.user_profiles p
    join public.allowed_users a on lower(a.email) = lower(p.email)
    where p.user_id = p_user_id and p.completed_at is not null
      and p.reference_age between 20 and 59 and a.status = 'active' and a.agreed_at is not null
  ) then
    raise exception 'Prayer room access denied' using errcode = '42501';
  end if;

  insert into public.prayer_room_presence as existing (user_id, x, y, facing, avatar_id, last_seen)
  values (p_user_id, p_x, p_y, p_facing, p_avatar_id, stamp)
  on conflict (user_id) do update set
    x = excluded.x, y = excluded.y, facing = excluded.facing, avatar_id = excluded.avatar_id,
    presence_id = case when existing.last_seen < stamp - interval '15 seconds'
      then gen_random_uuid() else existing.presence_id end,
    last_seen = excluded.last_seen
  returning last_seen into own_join;

  if own_join is not null and p_chat is not null and not exists (
    select 1 from public.prayer_room_messages m
    where m.user_id = p_user_id and m.created_at > stamp - interval '4 seconds'
  ) then
    insert into public.prayer_room_messages (user_id, body, created_at) values (p_user_id, p_chat, stamp);
    sent := true;
  end if;

  select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) into peers from (
    select r.presence_id as id, p.nickname, r.x, r.y, r.facing, r.avatar_id as "avatarId"
    from public.prayer_room_presence r
    join public.user_profiles p on p.user_id = r.user_id
    join public.allowed_users a on lower(a.email) = lower(p.email) and a.status = 'active' and a.agreed_at is not null
    where r.user_id <> p_user_id and r.last_seen > stamp - interval '15 seconds'
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
      and not exists (select 1 from public.user_blocks b where
        (b.blocker_user_id = p_user_id and b.blocked_user_id = m.user_id)
        or (b.blocker_user_id = m.user_id and b.blocked_user_id = p_user_id))
    order by m.created_at desc, m.id desc
    limit 24
  ) q;

  return jsonb_build_object('peers', peers, 'messages', messages, 'chatSent', sent);
end;
$$;

revoke all on function public.exchange_prayer_room_state(uuid, smallint, smallint, text, text, text) from public, anon, authenticated;
grant execute on function public.exchange_prayer_room_state(uuid, smallint, smallint, text, text, text) to service_role;
grant select, insert, update, delete on public.prayer_room_presence, public.prayer_room_messages to service_role;

commit;
