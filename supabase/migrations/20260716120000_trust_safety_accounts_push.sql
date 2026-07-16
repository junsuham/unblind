-- Trust, safety, account lifecycle, and notification infrastructure.

create table if not exists public.user_blocks (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint user_blocks_cannot_block_self check (blocker_user_id <> blocked_user_id)
);

create index if not exists user_blocks_blocked_user_idx
on public.user_blocks (blocked_user_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can read own blocks" on public.user_blocks;
create policy "Users can read own blocks"
on public.user_blocks for select to authenticated
using (auth.uid() = blocker_user_id);

drop policy if exists "Users can create own blocks" on public.user_blocks;
create policy "Users can create own blocks"
on public.user_blocks for insert to authenticated
with check (auth.uid() = blocker_user_id and auth.uid() <> blocked_user_id);

drop policy if exists "Users can delete own blocks" on public.user_blocks;
create policy "Users can delete own blocks"
on public.user_blocks for delete to authenticated
using (auth.uid() = blocker_user_id);

grant select, insert, delete on public.user_blocks to authenticated;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  comments_enabled boolean not null default true,
  reactions_enabled boolean not null default true,
  manitto_enabled boolean not null default true,
  system_enabled boolean not null default true,
  quiet_start time,
  quiet_end time,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage own notification preferences" on public.notification_preferences;
create policy "Users manage own notification preferences"
on public.notification_preferences for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.notification_preferences to authenticated;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  device_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx
on public.push_tokens (user_id, is_active);

alter table public.push_tokens enable row level security;

drop policy if exists "Users manage own push tokens" on public.push_tokens;
create policy "Users manage own push tokens"
on public.push_tokens for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_tokens to authenticated;

alter table public.notifications
  add column if not exists href text,
  add column if not exists push_sent_at timestamptz,
  add column if not exists push_attempts integer not null default 0,
  add column if not exists push_last_error text;

create index if not exists notifications_push_queue_idx
on public.notifications (created_at)
where push_sent_at is null and push_attempts < 5;

alter table public.reports
  add column if not exists reporter_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reporter_email text,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_note text;

create or replace function public.set_reporter_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.reporter_user_id := auth.uid();
    new.reporter_email := coalesce(auth.jwt() ->> 'email', new.reporter_email);
    new.reporter_actor_key := coalesce(nullif(new.reporter_actor_key, ''), auth.uid()::text);
  end if;
  return new;
end;
$$;

drop trigger if exists reports_set_reporter_identity on public.reports;
create trigger reports_set_reporter_identity
before insert on public.reports
for each row execute function public.set_reporter_identity();

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
on public.reports for select to authenticated
using (reporter_user_id = auth.uid());

create table if not exists public.admin_user_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  email text not null,
  memo text,
  admin_email text,
  created_at timestamptz not null default now()
);

alter table public.admin_user_actions
  add column if not exists admin_email text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists admin_user_actions_email_created_idx
on public.admin_user_actions (lower(email), created_at desc);

alter table public.admin_user_actions enable row level security;
revoke all on public.admin_user_actions from anon, authenticated;

alter table public.admin_actions
  add column if not exists admin_email text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.account_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email_hash text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  result text not null default 'requested'
);

alter table public.account_deletion_audit enable row level security;
revoke all on public.account_deletion_audit from anon, authenticated;

create or replace function public.notify_post_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  post_title text;
  notification_type text;
begin
  select author_user_id, title into owner_id, post_title
  from public.posts where id = new.post_id;

  if owner_id is null then
    return new;
  end if;

  if tg_table_name = 'comments' then
    if owner_id <> new.author_user_id then
      insert into public.notifications
        (user_id, actor_user_id, type, post_id, href, title, body)
      values
        (owner_id, new.author_user_id, 'comment', new.post_id,
         '/post/' || new.post_id::text,
         '내 글에 새 댓글이 달렸어요', left(new.content, 80));
    end if;
  else
    notification_type := case when new.type = 'pray' then '기도' else '공감' end;
    insert into public.notifications
      (user_id, type, post_id, href, title, body)
    values
      (owner_id, 'reaction', new.post_id,
       '/post/' || new.post_id::text,
       case when new.type = 'pray' then '누군가 내 글을 위해 기도했어요'
            else '누군가 내 글에 공감했어요' end,
       post_title);
  end if;

  return new;
end;
$$;
