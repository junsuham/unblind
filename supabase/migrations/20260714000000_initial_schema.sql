-- Reproducible foundation for new environments. Later migrations evolve this schema.

create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
  email text primary key,
  status text not null default 'active' check (status in ('active', 'blocked')),
  memo text,
  agreed_at timestamptz,
  agreed_version text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('prayer', 'faith', 'daily')),
  title text not null check (char_length(title) between 2 and 120),
  content text not null check (char_length(content) between 2 and 5000),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  author_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  view_count bigint not null default 0,
  tags text[] not null default '{}'::text[],
  mentions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  author_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  mentions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  actor_key text not null,
  type text not null check (type in ('pray', 'empathize')),
  created_at timestamptz not null default now(),
  unique (post_id, actor_key, type)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reporter_actor_key text not null default auth.uid()::text,
  reason text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  target_type text not null,
  target_id uuid not null,
  report_id uuid references public.reports(id) on delete set null,
  memo text,
  admin_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.post_author_links (
  post_id uuid primary key references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.comment_author_links (
  comment_id uuid primary key references public.comments(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists allowed_users_email_lower_idx on public.allowed_users (lower(email));
create index if not exists posts_board_status_created_idx on public.posts (board, status, created_at desc);
create index if not exists posts_author_user_id_idx on public.posts (author_user_id);
create index if not exists comments_post_status_created_idx on public.comments (post_id, status, created_at asc);
create index if not exists comments_author_user_id_idx on public.comments (author_user_id);
create index if not exists reactions_post_id_idx on public.reactions (post_id);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists post_author_links_user_id_idx on public.post_author_links (user_id);
create index if not exists comment_author_links_user_id_idx on public.comment_author_links (user_id);

alter table public.allowed_users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;
alter table public.post_author_links enable row level security;
alter table public.comment_author_links enable row level security;

drop policy if exists "Users can read their access record" on public.allowed_users;
create policy "Users can read their access record"
on public.allowed_users for select to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Users can read visible or own posts" on public.posts;
create policy "Users can read visible or own posts"
on public.posts for select to authenticated
using (status = 'visible' or author_user_id = auth.uid());

drop policy if exists "Users can create own posts" on public.posts;
create policy "Users can create own posts"
on public.posts for insert to authenticated
with check (author_user_id = auth.uid() and status = 'visible');

drop policy if exists "Users can read visible or own comments" on public.comments;
create policy "Users can read visible or own comments"
on public.comments for select to authenticated
using (status = 'visible' or author_user_id = auth.uid());

drop policy if exists "Users can create own comments" on public.comments;
create policy "Users can create own comments"
on public.comments for insert to authenticated
with check (author_user_id = auth.uid() and status = 'visible');

drop policy if exists "Authenticated users can read reactions" on public.reactions;
create policy "Authenticated users can read reactions"
on public.reactions for select to authenticated using (true);

drop policy if exists "Authenticated users can create reactions" on public.reactions;
create policy "Authenticated users can create reactions"
on public.reactions for insert to authenticated with check (true);

drop policy if exists "Authenticated users can create reports" on public.reports;
create policy "Authenticated users can create reports"
on public.reports for insert to authenticated
with check (auth.uid() is not null);

grant select on public.allowed_users to authenticated;
grant select, insert on public.posts to authenticated;
grant select, insert on public.comments to authenticated;
grant select, insert on public.reactions to authenticated;
grant select, insert on public.reports to authenticated;
revoke all on public.admin_actions from anon, authenticated;
revoke all on public.post_author_links from anon, authenticated;
revoke all on public.comment_author_links from anon, authenticated;

create or replace function public.capture_content_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'posts' then
    insert into public.post_author_links (post_id, user_id, user_email)
    values (new.id, auth.uid(), lower(auth.jwt() ->> 'email'))
    on conflict (post_id) do nothing;
  else
    insert into public.comment_author_links (comment_id, post_id, user_id, user_email)
    values (new.id, new.post_id, auth.uid(), lower(auth.jwt() ->> 'email'))
    on conflict (comment_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_capture_author on public.posts;
create trigger posts_capture_author
after insert on public.posts
for each row execute function public.capture_content_author();

drop trigger if exists comments_capture_author on public.comments;
create trigger comments_capture_author
after insert on public.comments
for each row execute function public.capture_content_author();

create or replace function public.mark_beta_agreement(p_agreement_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or nullif(auth.jwt() ->> 'email', '') is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.allowed_users
  set agreed_at = now(),
      agreed_version = p_agreement_version,
      last_seen_at = now(),
      updated_at = now()
  where lower(email) = lower(auth.jwt() ->> 'email')
    and status = 'active';

  if not found then
    raise exception '승인된 계정을 찾을 수 없습니다.';
  end if;
end;
$$;

revoke all on function public.mark_beta_agreement(text) from public;
grant execute on function public.mark_beta_agreement(text) to authenticated;
