create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('comment', 'reaction', 'manitto', 'system')),
  post_id uuid references public.posts(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, update on public.notifications to authenticated;

create table if not exists public.saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

drop policy if exists "Users manage own saved posts" on public.saved_posts;
create policy "Users manage own saved posts"
on public.saved_posts for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, delete on public.saved_posts to authenticated;

create table if not exists public.manitto_settings (
  id integer primary key default 1 check (id = 1),
  is_active boolean not null default true,
  starts_on date,
  ends_on date,
  reveal_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.manitto_settings (id, is_active)
values (1, true)
on conflict (id) do nothing;

alter table public.manitto_settings enable row level security;
revoke all on public.manitto_settings from anon, authenticated;

create table if not exists public.manitto_participants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manitto_participants enable row level security;

drop policy if exists "Users manage own manitto participation" on public.manitto_participants;
create policy "Users manage own manitto participation"
on public.manitto_participants for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.manitto_participants to authenticated;

create table if not exists public.manitto_messages (
  id uuid primary key default gen_random_uuid(),
  week_key date not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 300),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists manitto_messages_recipient_idx
on public.manitto_messages (recipient_id, week_key, created_at desc);

alter table public.manitto_messages enable row level security;
revoke all on public.manitto_messages from anon, authenticated;

create table if not exists public.top100_tracks (
  id uuid primary key default gen_random_uuid(),
  rank integer not null unique check (rank between 1 and 100),
  youtube_id text not null unique,
  title text not null,
  artist text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.top100_tracks enable row level security;

drop policy if exists "Authenticated users read top tracks" on public.top100_tracks;
create policy "Authenticated users read top tracks"
on public.top100_tracks for select to authenticated
using (is_active = true);

grant select on public.top100_tracks to authenticated;

create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique check (char_length(word) between 2 and 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.banned_words enable row level security;
revoke all on public.banned_words from anon, authenticated;

create or replace function public.notify_post_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  post_title text;
begin
  select author_user_id, title into owner_id, post_title
  from public.posts where id = new.post_id;

  if owner_id is null then
    return new;
  end if;

  if tg_table_name = 'comments' then
    if owner_id <> new.author_user_id then
      insert into public.notifications
        (user_id, actor_user_id, type, post_id, title, body)
      values
        (owner_id, new.author_user_id, 'comment', new.post_id,
         '내 글에 새 댓글이 달렸어요', left(new.content, 80));
    end if;
  else
    insert into public.notifications
      (user_id, type, post_id, title, body)
    values
      (owner_id, 'reaction', new.post_id,
       case when new.type = 'pray' then '누군가 내 글을 위해 기도했어요'
            else '누군가 내 글에 공감했어요' end,
       post_title);
  end if;

  return new;
end;
$$;

drop trigger if exists comments_create_notification on public.comments;
create trigger comments_create_notification
after insert on public.comments
for each row execute function public.notify_post_activity();

drop trigger if exists reactions_create_notification on public.reactions;
create trigger reactions_create_notification
after insert on public.reactions
for each row execute function public.notify_post_activity();

create or replace function public.enforce_content_safety()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  combined_text text;
  matched_word text;
  recent_count integer;
begin
  combined_text := lower(
    case when tg_table_name = 'posts'
      then coalesce(new.title, '') || ' ' || coalesce(new.content, '')
      else coalesce(new.content, '')
    end
  );

  select word into matched_word
  from public.banned_words
  where is_active = true and combined_text like '%' || lower(word) || '%'
  limit 1;

  if matched_word is not null then
    raise exception using
      errcode = 'P0001',
      message = '운영 정책상 사용할 수 없는 표현이 포함되어 있습니다.';
  end if;

  if tg_table_name = 'posts' then
    select count(*) into recent_count from public.posts
    where author_user_id = new.author_user_id
      and created_at > now() - interval '1 hour';

    if recent_count >= 5 then
      raise exception using errcode = 'P0001',
        message = '한 시간에 게시글은 최대 5개까지 작성할 수 있습니다.';
    end if;

    if exists (
      select 1 from public.posts
      where author_user_id = new.author_user_id
        and created_at > now() - interval '60 seconds'
    ) then
      raise exception using errcode = 'P0001',
        message = '게시글을 연속으로 작성할 수 없습니다. 잠시 후 다시 시도해주세요.';
    end if;
  else
    select count(*) into recent_count from public.comments
    where author_user_id = new.author_user_id
      and created_at > now() - interval '1 hour';

    if recent_count >= 30 then
      raise exception using errcode = 'P0001',
        message = '한 시간에 댓글은 최대 30개까지 작성할 수 있습니다.';
    end if;

    if exists (
      select 1 from public.comments
      where author_user_id = new.author_user_id
        and created_at > now() - interval '10 seconds'
    ) then
      raise exception using errcode = 'P0001',
        message = '댓글을 연속으로 작성할 수 없습니다. 잠시 후 다시 시도해주세요.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_enforce_safety on public.posts;
create trigger posts_enforce_safety
before insert on public.posts
for each row execute function public.enforce_content_safety();

drop trigger if exists comments_enforce_safety on public.comments;
create trigger comments_enforce_safety
before insert on public.comments
for each row execute function public.enforce_content_safety();

delete from public.reports newer
using public.reports older
where newer.ctid > older.ctid
  and newer.target_type = older.target_type
  and newer.target_id = older.target_id
  and newer.reporter_actor_key = older.reporter_actor_key;

create unique index if not exists reports_unique_reporter_target_idx
on public.reports (target_type, target_id, reporter_actor_key);

create or replace function public.auto_hide_reported_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  report_count integer;
begin
  select count(*) into report_count
  from public.reports
  where target_type = new.target_type
    and target_id = new.target_id
    and status = 'pending';

  if report_count >= 3 then
    if new.target_type = 'post' then
      update public.posts set status = 'hidden'
      where id = new.target_id and status = 'visible';
    elsif new.target_type = 'comment' then
      update public.comments set status = 'hidden'
      where id = new.target_id and status = 'visible';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reports_auto_hide_content on public.reports;
create trigger reports_auto_hide_content
after insert on public.reports
for each row execute function public.auto_hide_reported_content();
