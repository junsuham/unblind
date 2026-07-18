-- Content writes are handled by authenticated Next.js route handlers. Keeping
-- reads under RLS while revoking direct browser inserts prevents actor-key
-- spoofing and makes request throttling consistent across web clients.

revoke insert on public.posts from authenticated;
revoke insert on public.comments from authenticated;
revoke insert on public.reactions from authenticated;
revoke insert on public.reports from authenticated;
revoke insert, delete on public.saved_posts from authenticated;

create table if not exists public.web_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_user_idx
on public.web_push_subscriptions (user_id, is_active);

alter table public.web_push_subscriptions enable row level security;
revoke all on public.web_push_subscriptions from anon, authenticated;

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

  if owner_id is null then return new; end if;

  if tg_table_name = 'comments' then
    if owner_id <> new.author_user_id then
      insert into public.notifications
        (user_id, actor_user_id, type, post_id, href, title, body)
      values
        (owner_id, new.author_user_id, 'comment', new.post_id, '/post/' || new.post_id::text,
         '내 글에 새 댓글이 달렸어요', left(new.content, 80));
    end if;
  else
    insert into public.notifications
      (user_id, type, post_id, href, title, body)
    values
      (owner_id, 'reaction', new.post_id, '/post/' || new.post_id::text,
       case when new.type = 'pray' then '누군가 내 글을 위해 기도했어요'
            else '누군가 내 글에 공감했어요' end,
       post_title);
  end if;

  return new;
end;
$$;

alter table public.posts
  drop constraint if exists posts_title_app_length_check,
  add constraint posts_title_app_length_check check (char_length(title) between 2 and 80) not valid;

alter table public.posts
  drop constraint if exists posts_content_app_length_check,
  add constraint posts_content_app_length_check check (char_length(content) between 10 and 2000) not valid;

alter table public.comments
  drop constraint if exists comments_content_app_length_check,
  add constraint comments_content_app_length_check check (char_length(content) between 2 and 1000) not valid;

alter table public.reports
  drop constraint if exists reports_detail_app_length_check,
  add constraint reports_detail_app_length_check check (detail is null or char_length(detail) <= 500) not valid;

-- Constraints remain NOT VALID so legacy posts are preserved; PostgreSQL still
-- enforces them for every new or changed row.

create or replace function public.anonymize_account_data(
  p_user_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or btrim(coalesce(p_email, '')) = '' then
    raise exception 'user id and email are required';
  end if;

  update public.posts set author_user_id = null where author_user_id = p_user_id;
  update public.comments set author_user_id = null where author_user_id = p_user_id;
  update public.reports set reporter_user_id = null, reporter_email = null where reporter_user_id = p_user_id;

  delete from public.post_author_links where user_id = p_user_id;
  delete from public.comment_author_links where user_id = p_user_id;
  delete from public.reactions where actor_key in (p_user_id::text, 'user:' || p_user_id::text);
  delete from public.allowed_users where lower(email) = lower(btrim(p_email));
end;
$$;

create or replace function public.moderate_content(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_report_id uuid,
  p_memo text,
  p_admin_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_action not in ('hide', 'delete', 'restore', 'dismiss') then
    raise exception 'invalid moderation action';
  end if;
  if p_target_type not in ('post', 'comment') or p_target_id is null then
    raise exception 'invalid moderation target';
  end if;
  if char_length(btrim(coalesce(p_memo, ''))) < 3 then
    raise exception 'moderation memo is required';
  end if;

  if p_action <> 'dismiss' then
    v_status := case p_action when 'hide' then 'hidden' when 'delete' then 'deleted' else 'visible' end;
    if p_target_type = 'post' then
      update public.posts set status = v_status where id = p_target_id;
    else
      update public.comments set status = v_status where id = p_target_id;
    end if;
    if not found then raise exception 'moderation target not found'; end if;
  end if;

  if p_report_id is not null then
    update public.reports
    set status = case when p_action = 'dismiss' then 'dismissed' else 'reviewed' end,
        resolved_at = now(),
        resolution_note = btrim(p_memo)
    where id = p_report_id;
    if not found then raise exception 'report not found'; end if;
  end if;

  insert into public.admin_actions
    (action_type, target_type, target_id, report_id, memo, admin_email)
  values
    (p_action, p_target_type, p_target_id, p_report_id, btrim(p_memo), p_admin_email);
end;
$$;

revoke all on function public.anonymize_account_data(uuid, text) from public;
revoke all on function public.moderate_content(text, text, uuid, uuid, text, text) from public;
grant execute on function public.anonymize_account_data(uuid, text) to service_role;
grant execute on function public.moderate_content(text, text, uuid, uuid, text, text) to service_role;

create or replace function public.prune_operational_data()
returns table (events_deleted bigint, rate_limits_deleted bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events_deleted bigint;
  v_rate_limits_deleted bigint;
begin
  delete from public.app_events where created_at < now() - interval '90 days';
  get diagnostics v_events_deleted = row_count;

  delete from public.request_rate_limits where updated_at < now() - interval '2 days';
  get diagnostics v_rate_limits_deleted = row_count;

  delete from public.notifications where read_at is not null and read_at < now() - interval '90 days';
  delete from public.push_tokens where is_active = false and updated_at < now() - interval '30 days';
  delete from public.web_push_subscriptions where is_active = false and updated_at < now() - interval '30 days';
  delete from public.account_deletion_audit where requested_at < now() - interval '1 year';
  delete from public.admin_actions where created_at < now() - interval '2 years';
  delete from public.admin_user_actions where created_at < now() - interval '2 years';

  update public.reports
  set reporter_user_id = null, reporter_email = null
  where resolved_at is not null
    and resolved_at < now() - interval '1 year'
    and (reporter_user_id is not null or reporter_email is not null);

  return query select v_events_deleted, v_rate_limits_deleted;
end;
$$;

revoke all on function public.prune_operational_data() from public;
grant execute on function public.prune_operational_data() to service_role;
